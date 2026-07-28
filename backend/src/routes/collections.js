const express = require('express');
const { db } = require('../db');
const { collections, families, committeeMembers } = require('../db/schema');
const { eq, desc, and, gte, lte } = require('drizzle-orm');

const router = express.Router();

// Get all collections
router.get('/', async (req, res) => {
  try {
    const { type, familyId, startDate, endDate } = req.query;
    let query = db.select({
      id: collections.id,
      type: collections.type,
      familyId: collections.familyId,
      familyHeadName: families.headName,
      amount: collections.amount,
      date: collections.date,
      note: collections.note,
      enteredBy: collections.enteredBy,
      committeeMemberName: committeeMembers.name,
    }).from(collections)
      .leftJoin(families, eq(collections.familyId, families.id))
      .leftJoin(committeeMembers, eq(collections.enteredBy, committeeMembers.id))
      .orderBy(desc(collections.date));

    const conditions = [];
    if (type) conditions.push(eq(collections.type, type));
    if (familyId) conditions.push(eq(collections.familyId, parseInt(familyId)));
    if (startDate) conditions.push(gte(collections.date, startDate));
    if (endDate) conditions.push(lte(collections.date, endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const collectionList = await query;
    res.json(collectionList);
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get single collection
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [collection] = await db.select({
      id: collections.id,
      type: collections.type,
      familyId: collections.familyId,
      familyHeadName: families.headName,
      amount: collections.amount,
      date: collections.date,
      note: collections.note,
      enteredBy: collections.enteredBy,
      committeeMemberName: committeeMembers.name,
    }).from(collections)
      .leftJoin(families, eq(collections.familyId, families.id))
      .leftJoin(committeeMembers, eq(collections.enteredBy, committeeMembers.id))
      .where(eq(collections.id, id));

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Create collection
router.post('/', async (req, res) => {
  try {
    const { type, familyId, amount, date, note } = req.body;

    const [newCollection] = await db.insert(collections).values({
      type,
      familyId: familyId || null,
      amount,
      date,
      note,
    }).returning();

    res.status(201).json(newCollection);
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Update collection
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, familyId, amount, date, note } = req.body;

    const [updatedCollection] = await db.update(collections)
      .set({ type, familyId, amount, date, note })
      .where(eq(collections.id, id))
      .returning();

    res.json(updatedCollection);
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete collection
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(collections).where(eq(collections.id, req.params.id));
    res.json({ message: 'Collection deleted' });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// Get summary by type
router.get('/summary/total', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    let query = db.select({
      type: collections.type,
      total: collections.amount,
    }).from(collections);

    const conditions = [];
    if (type) conditions.push(eq(collections.type, type));
    if (startDate) conditions.push(gte(collections.date, startDate));
    if (endDate) conditions.push(lte(collections.date, endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;
    
    // Group by type and sum
    const summary = {};
    results.forEach(r => {
      if (!summary[r.type]) {
        summary[r.type] = 0;
      }
      summary[r.type] += r.total;
    });

    res.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
