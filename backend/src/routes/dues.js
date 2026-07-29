const express = require('express');
const { db } = require('../db');
const { duesEntries } = require('../db/schema');
const { eq, desc, and, sql } = require('drizzle-orm');

const router = express.Router();

// Get all people with their current approved balance
// Returns a list of unique people with their latest approved balance
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/dues - Fetching all people with approved balances');

    // Get all approved entries, ordered by person name and then by date (newest first)
    const approvedEntries = await db
      .select()
      .from(duesEntries)
      .where(eq(duesEntries.status, 'approved'))
      .orderBy(duesEntries.personName, desc(duesEntries.approvedAt));

    // Group by person and get the latest approved balance for each
    const peopleMap = new Map();
    
    for (const entry of approvedEntries) {
      const key = `${entry.personName}-${entry.phone || ''}`;
      if (!peopleMap.has(key)) {
        peopleMap.set(key, {
          personName: entry.personName,
          phone: entry.phone,
          currentBalance: entry.newBalance,
          lastUpdated: entry.approvedAt,
        });
      } else {
        // If we have multiple approved entries, use the most recent one
        const existing = peopleMap.get(key);
        if (entry.approvedAt > existing.lastUpdated) {
          peopleMap.set(key, {
            personName: entry.personName,
            phone: entry.phone,
            currentBalance: entry.newBalance,
            lastUpdated: entry.approvedAt,
          });
        }
      }
    }

    // Convert to array and sort alphabetically by name
    const people = Array.from(peopleMap.values()).sort((a, b) => 
      a.personName.localeCompare(b.personName)
    );

    console.log(`✅ Found ${people.length} people with approved balances`);
    res.json(people);
  } catch (error) {
    console.error('❌ GET /api/dues ERROR:', error);
    res.status(500).json({ error: 'Failed to fetch dues' });
  }
});

// Get pending entries for approval
router.get('/pending', async (req, res) => {
  try {
    console.log('📋 GET /api/dues/pending - Fetching pending entries');

    const pendingEntries = await db
      .select()
      .from(duesEntries)
      .where(eq(duesEntries.status, 'pending'))
      .orderBy(desc(duesEntries.createdAt));

    console.log(`✅ Found ${pendingEntries.length} pending entries`);
    res.json(pendingEntries);
  } catch (error) {
    console.error('❌ GET /api/dues/pending ERROR:', error);
    res.status(500).json({ error: 'Failed to fetch pending entries' });
  }
});

// Add a new person with starting balance
// This creates an approved entry with paymentAmount=0 to establish the initial balance
router.post('/', async (req, res) => {
  try {
    const { personName, phone, startingBalance } = req.body;

    console.log('➕ POST /api/dues - Adding new person:', { personName, phone, startingBalance });

    if (!personName) {
      return res.status(400).json({ error: 'Person name is required' });
    }

    const balance = startingBalance || 0;

    // Create an approved entry to establish the initial balance
    const [newEntry] = await db.insert(duesEntries).values({
      personName,
      phone: phone || null,
      oldBalance: 0,
      paymentAmount: 0,
      newBalance: balance,
      status: 'approved',
      approvedBy: null, // System-created entry
      approvedAt: new Date(),
    }).returning();

    console.log('✅ Person added successfully:', newEntry);
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('❌ POST /api/dues ERROR:', error);
    res.status(500).json({ error: 'Failed to add person' });
  }
});

// Submit a new payment (creates a pending entry)
// Note: This uses the person's name/phone to identify them, not an ID
router.post('/payment', async (req, res) => {
  try {
    const { personName, phone, paymentAmount } = req.body;

    console.log('💰 POST /api/dues/payment - Submitting payment:', { personName, phone, paymentAmount });

    if (!personName || !paymentAmount) {
      return res.status(400).json({ error: 'Person name and payment amount are required' });
    }

    // Get the current approved balance for this person
    const approvedEntries = await db
      .select()
      .from(duesEntries)
      .where(and(
        eq(duesEntries.status, 'approved'),
        eq(duesEntries.personName, personName)
      ))
      .orderBy(desc(duesEntries.approvedAt))
      .limit(1);

    const currentBalance = approvedEntries.length > 0 ? approvedEntries[0].newBalance : 0;
    const oldBalance = currentBalance;
    const newBalance = currentBalance - paymentAmount;

    // Create a pending entry
    const [newEntry] = await db.insert(duesEntries).values({
      personName,
      phone: phone || null,
      oldBalance,
      paymentAmount,
      newBalance,
      status: 'pending',
    }).returning();

    console.log('✅ Payment submitted successfully:', newEntry);
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('❌ POST /api/dues/payment ERROR:', error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// Approve a pending entry (must come before /:id to avoid route conflict)
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { committeeMemberId } = req.body;

    console.log('✅ POST /api/dues/:id/approve - Approving entry:', id);

    // Get the pending entry
    const [entry] = await db
      .select()
      .from(duesEntries)
      .where(eq(duesEntries.id, id));

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.status !== 'pending') {
      return res.status(400).json({ error: 'Entry is not pending' });
    }

    if (!committeeMemberId) {
      return res.status(400).json({ error: 'Committee member ID is required' });
    }

    // Update the entry to approved
    const [updatedEntry] = await db.update(duesEntries)
      .set({
        status: 'approved',
        approvedBy: committeeMemberId,
        approvedAt: new Date(),
      })
      .where(eq(duesEntries.id, id))
      .returning();

    console.log('✅ Entry approved successfully:', updatedEntry);
    res.json(updatedEntry);
  } catch (error) {
    console.error('❌ POST /api/dues/:id/approve ERROR:', error);
    res.status(500).json({ error: 'Failed to approve entry' });
  }
});

// Reject a pending entry (must come before /:id to avoid route conflict)
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('❌ POST /api/dues/:id/reject - Rejecting entry:', id);

    // Get the pending entry
    const [entry] = await db
      .select()
      .from(duesEntries)
      .where(eq(duesEntries.id, id));

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.status !== 'pending') {
      return res.status(400).json({ error: 'Entry is not pending' });
    }

    // Update the entry to rejected
    const [updatedEntry] = await db.update(duesEntries)
      .set({
        status: 'rejected',
      })
      .where(eq(duesEntries.id, id))
      .returning();

    console.log('✅ Entry rejected successfully:', updatedEntry);
    res.json(updatedEntry);
  } catch (error) {
    console.error('❌ POST /api/dues/:id/reject ERROR:', error);
    res.status(500).json({ error: 'Failed to reject entry' });
  }
});

// Get a specific entry by ID (must come after specific routes to avoid conflicts)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [entry] = await db
      .select()
      .from(duesEntries)
      .where(eq(duesEntries.id, id));

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('❌ GET /api/dues/:id ERROR:', error);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

module.exports = router;
