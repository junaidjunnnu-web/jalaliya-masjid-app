const express = require('express');
const { db } = require('../db');
const { families, familyMembers, places, users } = require('../db/schema');
const { eq, and, like, or, inArray, orderBy } = require('drizzle-orm');

const router = express.Router();

// Get all places (must be before /:id to avoid route matching issues)
router.get('/places', async (req, res) => {
  try {
    const allPlaces = await db.select().from(places);
    console.log('GET /families/places - Returning places:', allPlaces);
    res.json(allPlaces);
  } catch (error) {
    console.error('Get places error:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

// Get all families (grouped by place) with member counts
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

    // Search across member names
    if (search) {
      // Get family IDs that have members matching the search
      const matchingFamilyIds = await db.select({ familyId: familyMembers.familyId })
        .from(familyMembers)
        .where(like(familyMembers.name, `%${search}%`));

      const familyIds = matchingFamilyIds.map(m => m.familyId);

      if (familyIds.length > 0) {
        query = query.where(inArray(families.id, familyIds));
      } else {
        // If no member matches, return empty
        return res.json([]);
      }
    }

    const allFamilies = await query;

    // Get member counts for each family
    const familyIds = allFamilies.map(f => f.id);
    let memberCounts = [];
    if (familyIds.length > 0) {
      memberCounts = await db.select({ familyId: familyMembers.familyId })
        .from(familyMembers)
        .where(inArray(familyMembers.familyId, familyIds));
    }

    const countMap = {};
    memberCounts.forEach(mc => {
      countMap[mc.familyId] = (countMap[mc.familyId] || 0) + 1;
    });

    // Get first member for each family to use as home name
    let firstMembers = [];
    if (familyIds.length > 0) {
      firstMembers = await db.select()
        .from(familyMembers)
        .where(inArray(familyMembers.familyId, familyIds));
    }

    const memberMap = {};
    firstMembers.forEach(m => {
      if (!memberMap[m.familyId]) {
        memberMap[m.familyId] = m;
      }
    });

    // Group by place
    const grouped = {};
    allFamilies.forEach(family => {
      const memberCount = countMap[family.id] || 0;
      
      // Skip families with 0 members
      if (memberCount === 0) {
        return;
      }
      
      const placeName = family.placeName || 'Other';
      if (!grouped[placeName]) {
        grouped[placeName] = [];
      }
      grouped[placeName].push({
        ...family,
        memberCount,
        firstMember: memberMap[family.id] || null,
      });
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

// Create family with members
router.post('/', async (req, res) => {
  try {
    console.log('POST /families - Request body:', JSON.stringify(req.body, null, 2));
    const { placeId, address, photoUrl, monthlyFeeMarried, monthlyFeeUnmarried, status, members } = req.body;

    console.log('POST /families - Destructured values:', {
      placeId,
      address,
      photoUrl,
      monthlyFeeMarried,
      monthlyFeeUnmarried,
      status,
      membersCount: members?.length,
      firstMember: members?.[0]
    });

    // Get the first member's name for backward compatibility with families table
    const firstMember = members && members.length > 0 ? members[0] : null;
    const headName = firstMember?.name || 'Unknown';
    const headPhone = firstMember?.phone || '';

    console.log('POST /families - Computed headName/headPhone:', { headName, headPhone });

    // Create the family (home)
    const [newFamily] = await db.insert(families).values({
      headName,
      headPhone,
      placeId,
      address,
      photoUrl,
      monthlyFeeMarried: monthlyFeeMarried || 300,
      monthlyFeeUnmarried: monthlyFeeUnmarried || 200,
      status: status || 'approved',
    }).returning();

    console.log('Family created successfully:', newFamily);

    // Create ALL members if provided (including the first one)
    if (members && members.length > 0) {
      const memberData = members.map(member => ({
        familyId: newFamily.id,
        name: member.name,
        relation: member.relation,
        phone: member.phone || null,
        age: member.age || null,
        gender: member.gender || null,
        maritalStatus: member.maritalStatus || null,
        occupation: member.occupation || null,
        isFeeApplicable: member.isFeeApplicable !== undefined ? member.isFeeApplicable : true,
      }));

      const createdMembers = await db.insert(familyMembers).values(memberData).returning();
      console.log('All members created successfully (including first):', createdMembers);

      res.status(201).json({
        family: newFamily,
        members: createdMembers,
      });
    } else {
      res.status(201).json({
        family: newFamily,
        members: [],
      });
    }
  } catch (error) {
    console.error('Create family error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create family', details: error.message });
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
    const { name, relation, phone, age, gender, maritalStatus, occupation, isFeeApplicable } = req.body;

    const [newMember] = await db.insert(familyMembers).values({
      familyId: id,
      name,
      relation,
      phone: phone || null,
      age: age || null,
      gender: gender || null,
      maritalStatus: maritalStatus || null,
      occupation: occupation || null,
      isFeeApplicable: isFeeApplicable !== undefined ? isFeeApplicable : true,
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
    const { name, relation, phone, age, gender, maritalStatus, occupation, isFeeApplicable } = req.body;

    const [updatedMember] = await db.update(familyMembers)
      .set({
        name,
        relation,
        phone: phone || null,
        age: age || null,
        gender: gender || null,
        maritalStatus: maritalStatus || null,
        occupation: occupation || null,
        isFeeApplicable: isFeeApplicable !== undefined ? isFeeApplicable : true,
      })
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

    // Get the member being deleted to check if they match headName/headPhone
    const [memberToDelete] = await db.select()
      .from(familyMembers)
      .where(eq(familyMembers.id, memberId));

    if (!memberToDelete) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Get the current family to check headName/headPhone
    const [currentFamily] = await db.select()
      .from(families)
      .where(eq(families.id, id));

    if (!currentFamily) {
      return res.status(404).json({ error: 'Family not found' });
    }

    // Delete the member
    await db.delete(familyMembers).where(eq(familyMembers.id, memberId));

    // If the deleted member matches headName/headPhone, update the family to use the next member
    if (currentFamily.headName === memberToDelete.name && currentFamily.headPhone === memberToDelete.phone) {
      // Get remaining members for this family
      const remainingMembers = await db.select()
        .from(familyMembers)
        .where(eq(familyMembers.familyId, id))
        .orderBy(familyMembers.id)
        .limit(1);

      if (remainingMembers.length > 0) {
        // Update family to use the next member as head
        const nextMember = remainingMembers[0];
        await db.update(families)
          .set({
            headName: nextMember.name,
            headPhone: nextMember.phone || null
          })
          .where(eq(families.id, id));
      } else {
        // No members left, clear headName/headPhone
        await db.update(families)
          .set({
            headName: null,
            headPhone: null
          })
          .where(eq(families.id, id));
      }
    }

    res.json({ message: 'Member deleted' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete family member' });
  }
});

module.exports = router;
