const express = require('express');
const { db } = require('../db');
const { committeeMembers } = require('../db/schema');
const { eq } = require('drizzle-orm');
const { auth, committeeOnly } = require('../middleware/auth');

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

// Create committee member (committee only)
router.post('/', auth, committeeOnly, async (req, res) => {
  try {
    const { name, designation, phone, photoUrl, tenureStart, tenureEnd } = req.body;

    const [newMember] = await db.insert(committeeMembers).values({
      name,
      designation,
      phone,
      photoUrl,
      tenureStart,
      tenureEnd,
    }).returning();

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Create committee member error:', error);
    res.status(500).json({ error: 'Failed to create committee member' });
  }
});

// Update committee member (committee only)
router.put('/:id', auth, committeeOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, phone, photoUrl, tenureStart, tenureEnd } = req.body;

    const [updatedMember] = await db.update(committeeMembers)
      .set({ name, designation, phone, photoUrl, tenureStart, tenureEnd })
      .where(eq(committeeMembers.id, id))
      .returning();

    res.json(updatedMember);
  } catch (error) {
    console.error('Update committee member error:', error);
    res.status(500).json({ error: 'Failed to update committee member' });
  }
});

// Delete committee member (committee only)
router.delete('/:id', auth, committeeOnly, async (req, res) => {
  try {
    await db.delete(committeeMembers).where(eq(committeeMembers.id, req.params.id));
    res.json({ message: 'Committee member deleted' });
  } catch (error) {
    console.error('Delete committee member error:', error);
    res.status(500).json({ error: 'Failed to delete committee member' });
  }
});

module.exports = router;
