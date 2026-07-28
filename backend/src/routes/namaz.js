const express = require('express');
const { db } = require('../db');
const { namazTimings } = require('../db/schema');
const { eq, desc } = require('drizzle-orm');

const router = express.Router();

// Get current namaz timings (most recent effective_from)
router.get('/', async (req, res) => {
  try {
    const [timings] = await db.select().from(namazTimings)
      .orderBy(desc(namazTimings.effectiveFrom))
      .limit(1);

    res.json(timings || null);
  } catch (error) {
    console.error('Get namaz timings error:', error);
    res.status(500).json({ error: 'Failed to fetch namaz timings' });
  }
});

// Get all namaz timings history
router.get('/history', async (req, res) => {
  try {
    const timings = await db.select().from(namazTimings).orderBy(desc(namazTimings.effectiveFrom));
    res.json(timings);
  } catch (error) {
    console.error('Get namaz history error:', error);
    res.status(500).json({ error: 'Failed to fetch namaz history' });
  }
});

// Create namaz timings
router.post('/', async (req, res) => {
  try {
    const {
      effectiveFrom,
      fajrAzan,
      fajrIqamah,
      zuhrAzan,
      zuhrIqamah,
      asrAzan,
      asrIqamah,
      maghribAzan,
      maghribIqamah,
      ishaAzan,
      ishaIqamah,
      jummaKhutbahTime,
      sehriTime,
      iftarTime,
    } = req.body;

    const [newTimings] = await db.insert(namazTimings).values({
      effectiveFrom,
      fajrAzan,
      fajrIqamah,
      zuhrAzan,
      zuhrIqamah,
      asrAzan,
      asrIqamah,
      maghribAzan,
      maghribIqamah,
      ishaAzan,
      ishaIqamah,
      jummaKhutbahTime,
      sehriTime,
      iftarTime,
    }).returning();

    res.status(201).json(newTimings);
  } catch (error) {
    console.error('Create namaz timings error:', error);
    res.status(500).json({ error: 'Failed to create namaz timings' });
  }
});

// Update namaz timings (committee only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      effectiveFrom,
      fajrAzan,
      fajrIqamah,
      zuhrAzan,
      zuhrIqamah,
      asrAzan,
      asrIqamah,
      maghribAzan,
      maghribIqamah,
      ishaAzan,
      ishaIqamah,
      jummaKhutbahTime,
      sehriTime,
      iftarTime,
    } = req.body;

    const [updatedTimings] = await db.update(namazTimings)
      .set({
        effectiveFrom,
        fajrAzan,
        fajrIqamah,
        zuhrAzan,
        zuhrIqamah,
        asrAzan,
        asrIqamah,
        maghribAzan,
        maghribIqamah,
        ishaAzan,
        ishaIqamah,
        jummaKhutbahTime,
        sehriTime,
        iftarTime,
      })
      .where(eq(namazTimings.id, id))
      .returning();

    res.json(updatedTimings);
  } catch (error) {
    console.error('Update namaz timings error:', error);
    res.status(500).json({ error: 'Failed to update namaz timings' });
  }
});

module.exports = router;
