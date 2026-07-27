const express = require('express');
const { db } = require('../db');
const { families, familyMembers, places, users } = require('../db/schema');
const { eq, and, like, or } = require('drizzle-orm');
const { auth, committeeOnly } = require('../middleware/auth');

const router = express.Router();

// Helper: Filter family data based on role
const filterFamilyData = (family, userRole, userFamilyId) => {
  if (userRole === 'committee') {
    return family; // Full access
  }
  
  // Member viewing their own family
  if (userFamilyId && family.id === userFamilyId) {
    return family; // Full access to own family
  }
  
  // Member viewing other families - limited data
  return {
    id: family.id,
    headName: family.headName,
    place: family.place,
    photoUrl: family.photoUrl,
    // No phone, no address for other families
  };
};

// Get all families (grouped by place)
router.get('/', auth, async (req, res) => {
  try {
    const { search, status } = req.query;
    const userRole = req.user.role;
    const userFamilyId = req.user.familyId;

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

    // Members can only see approved families (except their own)
    if (userRole === 'member') {
      query = query.where(
        or(
          eq(families.status, 'approved'),
          eq(families.id, userFamilyId)
        )
      );
    }

    // Committee can filter by status
    if (userRole === 'committee' && status) {
      query = query.where(eq(families.status, status));
    }

    // Search (committee only for phone search)
    if (search) {
      if (userRole === 'committee') {
        query = query.where(
          or(
            like(families.headName, `%${search}%`),
            like(families.headPhone, `%${search}%`)
          )
        );
      } else {
        // Members can only search by name
        query = query.where(like(families.headName, `%${search}%`));
      }
    }

    const allFamilies = await query;

    // Group by place
    const grouped = {};
    allFamilies.forEach(family => {
      const placeName = family.placeName || 'Other';
      if (!grouped[placeName]) {
        grouped[placeName] = [];
      }
      grouped[placeName].push(filterFamilyData(family, userRole, userFamilyId));
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
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userFamilyId = req.user.familyId;

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

    // Members can only view approved families (except their own)
    if (userRole === 'member' && family.status !== 'approved' && family.id !== userFamilyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get family members
    const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, id));

    // Filter member data based on role
    const filteredFamily = filterFamilyData(family, userRole, userFamilyId);
    
    // Members viewing other families get limited member data
    let filteredMembers = members;
    if (userRole === 'member' && family.id !== userFamilyId) {
      filteredMembers = members.map(m => ({
        id: m.id,
        name: m.name,
        relation: m.relation,
        // No age, gender, marital status for other families
      }));
    }

    res.json({
      family: filteredFamily,
      members: filteredMembers,
    });
  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({ error: 'Failed to fetch family' });
  }
});

// Create family (committee only)
router.post('/', auth, committeeOnly, async (req, res) => {
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
      createdBy: req.user.committeeMemberId,
    }).returning();

    res.status(201).json(newFamily);
  } catch (error) {
    console.error('Create family error:', error);
    res.status(500).json({ error: 'Failed to create family' });
  }
});

// Update family
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userFamilyId = req.user.familyId;

    // Committee can edit any family
    // Members can only edit their own family
    if (userRole === 'member' && parseInt(id) !== userFamilyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

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
        // Members editing their own family sets status back to pending
        status: userRole === 'member' ? 'pending' : undefined,
      })
      .where(eq(families.id, id))
      .returning();

    res.json(updatedFamily);
  } catch (error) {
    console.error('Update family error:', error);
    res.status(500).json({ error: 'Failed to update family' });
  }
});

// Approve family (committee only)
router.patch('/:id/approve', auth, committeeOnly, async (req, res) => {
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
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userFamilyId = req.user.familyId;

    if (userRole === 'member' && parseInt(id) !== userFamilyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

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
router.put('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userRole = req.user.role;
    const userFamilyId = req.user.familyId;

    if (userRole === 'member' && parseInt(id) !== userFamilyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

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
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userRole = req.user.role;
    const userFamilyId = req.user.familyId;

    if (userRole === 'member' && parseInt(id) !== userFamilyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.delete(familyMembers).where(eq(familyMembers.id, memberId));
    res.json({ message: 'Member deleted' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete family member' });
  }
});

module.exports = router;
