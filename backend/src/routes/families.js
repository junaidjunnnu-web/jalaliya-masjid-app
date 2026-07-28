const express = require('express');
const { db } = require('../db');
const { families, familyMembers, places, users } = require('../db/schema');
const { eq, and, like, or } = require('drizzle-orm');

const router = express.Router();

// Get all families (grouped by place)
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = db.select({
      id: families.id,
      headName: families.headName,
      headPhone: families.headPhone,
      placeId: families.placeId,
      placeName: places.name,
      address: families.address,
      photoUrl: families.photoUrl,
      status: families.status,
      monthlyFeeMarried: families.monthlyFeeMarried,
      monthlyFeeUnmarried: families.monthlyFeeUnmarried,
      createdAt: families.createdAt,
    }).from(families).leftJoin(places, eq(families.placeId, places.id));

    // Filter by status
    if (status) {
      query = query.where(eq(families.status, status));
    }

    // Search
    if (search) {
      query = query.where(
        or(
          like(families.headName, `%${search}%`),
          like(families.headPhone, `%${search}%`)
        )
      );
    }

    const allFamilies = await query;

    // Group by place
    const grouped = {};
    allFamilies.forEach(family => {
      const placeName = family.placeName || 'Other';
      if (!grouped[placeName]) {
        grouped[placeName] = [];
      }
      grouped[placeName].push(family);
    });

    // Add member counts
    const result = Object.entries(grouped).map(([place, families]) => ({
      place,
      count: families.length,
      families,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get families error:', error);
    res.status(500).json({ error: 'Failed to fetch families' });
  }
});

// Get single family with members
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [family] = await db.select({
      id: families.id,
      headName: families.headName,
      headPhone: families.headPhone,
      placeId: families.placeId,
      placeName: places.name,
      address: families.address,
      photoUrl: families.photoUrl,
      status: families.status,
      monthlyFeeMarried: families.monthlyFeeMarried,
      monthlyFeeUnmarried: families.monthlyFeeUnmarried,
      createdAt: families.createdAt,
    }).from(families).leftJoin(places, eq(families.placeId, places.id)).where(eq(families.id, id));

    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    // Get family members
    const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, id));

    res.json({
      family,
      members,
    });
  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({ error: 'Failed to fetch family' });
  }
});

// Create family
router.post('/', async (req, res) => {
  try {
    const { headName, headPhone, placeId, address, photoUrl, monthlyFeeMarried, monthlyFeeUnmarried } = req.body;

    const [newFamily] = await db.insert(families).values({
      headName,
      headPhone,
      placeId,
      address,
      photoUrl,
      monthlyFeeMarried,
      monthlyFeeUnmarried,
      status: 'approved',
    }).returning();

    res.status(201).json(newFamily);
  } catch (error) {
    console.error('Create family error:', error);
    res.status(500).json({ error: 'Failed to create family' });
  }
});

// Update family
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { headName, headPhone, placeId, address, photoUrl, monthlyFeeMarried, monthlyFeeUnmarried } = req.body;

    const [updatedFamily] = await db.update(families)
      .set({
        headName,
        headPhone,
        placeId,
        address,
        photoUrl,
        monthlyFeeMarried,
        monthlyFeeUnmarried,
      })
      .where(eq(families.id, id))
      .returning();

    res.json(updatedFamily);
  } catch (error) {
    console.error('Update family error:', error);
    res.status(500).json({ error: 'Failed to update family' });
  }
});

// Approve family
router.patch('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const [updatedFamily] = await db.update(families)
      .set({ status: 'approved' })
      .where(eq(families.id, id))
      .returning();

    res.json(updatedFamily);
  } catch (error) {
    console.error('Approve family error:', error);
    res.status(500).json({ error: 'Failed to approve family' });
  }
});

// Add family member
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relation, age, gender, maritalStatus, isFeeApplicable } = req.body;

    const [newMember] = await db.insert(familyMembers).values({
      familyId: id,
      name,
      relation,
      age,
      gender,
      maritalStatus,
      isFeeApplicable,
    }).returning();

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add family member' });
  }
});

// Update family member
router.put('/:id/members/:memberId', async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { name, relation, age, gender, maritalStatus, isFeeApplicable } = req.body;

    const [updatedMember] = await db.update(familyMembers)
      .set({ name, relation, age, gender, maritalStatus, isFeeApplicable })
      .where(eq(familyMembers.id, memberId))
      .returning();

    res.json(updatedMember);
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update family member' });
  }
});

// Delete family member
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { id, memberId } = req.params;
    await db.delete(familyMembers).where(eq(familyMembers.id, memberId));
    res.json({ message: 'Member deleted' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete family member' });
  }
});

module.exports = router;
