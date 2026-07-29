const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../db');
const { committeeMembers } = require('../db/schema');
const { eq } = require('drizzle-orm');

const router = express.Router();

// Get all committee members (public)
router.get('/', async (req, res) => {
  try {
    const members = await db.select().from(committeeMembers);
    res.json(members);
  } catch (error) {
    console.error('Get committee error:', error);
    res.status(500).json({ error: 'Failed to fetch committee members' });
  }
});

// Get committee member by phone (must come before /:id to avoid route conflict)
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const [member] = await db.select().from(committeeMembers).where(eq(committeeMembers.phone, phone));
    
    if (!member) {
      return res.status(404).json({ error: 'Committee member not found' });
    }
    
    res.json([member]);
  } catch (error) {
    console.error('Get committee member by phone error:', error);
    res.status(500).json({ error: 'Failed to fetch committee member' });
  }
});

// Get single committee member
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [member] = await db.select().from(committeeMembers).where(eq(committeeMembers.id, id));
    
    if (!member) {
      return res.status(404).json({ error: 'Committee member not found' });
    }
    
    res.json(member);
  } catch (error) {
    console.error('Get committee member error:', error);
    res.status(500).json({ error: 'Failed to fetch committee member' });
  }
});

// Create committee member
router.post('/', async (req, res) => {
  try {
    console.log('POST /committee - Request body:', req.body);
    const { name, designation, phone, photoUrl, tenureStart, tenureEnd } = req.body;

    console.log('Inserting committee member with:', { name, designation, phone, photoUrl, tenureStart, tenureEnd });
    const [newMember] = await db.insert(committeeMembers).values({
      name,
      designation,
      phone,
      photoUrl: photoUrl || null,
      tenureStart: tenureStart || null,
      tenureEnd: tenureEnd || null,
    }).returning();

    console.log('Committee member created successfully:', newMember);
    res.status(201).json(newMember);
  } catch (error) {
    console.error('Create committee member error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create committee member', details: error.message });
  }
});

// Update committee member
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, phone, photoUrl, tenureStart, tenureEnd } = req.body;

    const [updatedMember] = await db.update(committeeMembers)
      .set({ 
        name, 
        designation, 
        phone, 
        photoUrl: photoUrl || null,
        tenureStart: tenureStart || null,
        tenureEnd: tenureEnd || null
      })
      .where(eq(committeeMembers.id, id))
      .returning();

    res.json(updatedMember);
  } catch (error) {
    console.error('Update committee member error:', error);
    res.status(500).json({ error: 'Failed to update committee member' });
  }
});

// Delete committee member
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(committeeMembers).where(eq(committeeMembers.id, req.params.id));
    res.json({ message: 'Committee member deleted' });
  } catch (error) {
    console.error('Delete committee member error:', error);
    res.status(500).json({ error: 'Failed to delete committee member' });
  }
});

// Committee login
router.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    console.log('🔑 COMMITTEE LOGIN REQUEST:', { phone });

    const [member] = await db.select().from(committeeMembers).where(eq(committeeMembers.phone, phone));
    if (!member) {
      console.log('❌ LOGIN FAILED: Committee member not found', phone);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!member.pinHash) {
      console.log('❌ LOGIN FAILED: No PIN set for member', member.id);
      return res.status(400).json({ error: 'No PIN set. Please set up your PIN first.' });
    }

    console.log('👤 Committee member found:', { id: member.id, name: member.name, phone: member.phone });

    const validPin = await bcrypt.compare(pin, member.pinHash);
    if (!validPin) {
      console.log('❌ LOGIN FAILED: Invalid PIN for member', member.id);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ PIN validated for committee member:', member.id);

    res.json({
      committeeMemberId: member.id,
      phone: member.phone,
      name: member.name,
      designation: member.designation,
    });
  } catch (error) {
    console.error('❌ COMMITTEE LOGIN ERROR:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Set committee PIN
router.post('/set-pin', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    console.log('🔐 SET PIN REQUEST:', { phone });

    const [member] = await db.select().from(committeeMembers).where(eq(committeeMembers.phone, phone));
    if (!member) {
      console.log('❌ SET PIN FAILED: Committee member not found', phone);
      return res.status(404).json({ error: 'Committee member not found' });
    }

    if (member.pinHash) {
      console.log('❌ SET PIN FAILED: PIN already set for member', member.id);
      return res.status(400).json({ error: 'PIN already set. Please use login instead.' });
    }

    if (!pin || pin.length < 4 || pin.length > 6) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' });
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);
    console.log('🔐 PIN hashed for committee member:', member.id);

    // Update member with PIN hash
    const [updatedMember] = await db.update(committeeMembers)
      .set({ pinHash })
      .where(eq(committeeMembers.id, member.id))
      .returning();

    console.log('✅ PIN set successfully for committee member:', member.id);

    res.json({ message: 'PIN set successfully', member: updatedMember });
  } catch (error) {
    console.error('❌ SET PIN ERROR:', error);
    res.status(500).json({ error: 'Failed to set PIN' });
  }
});

module.exports = router;
