const express = require('express');
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

module.exports = router;
