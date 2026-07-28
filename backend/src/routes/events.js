const express = require('express');
const { db } = require('../db');
const { events, committeeMembers } = require('../db/schema');
const { eq, desc, gte } = require('drizzle-orm');

const router = express.Router();

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const { upcoming } = req.query;
    let query = db.select({
      id: events.id,
      title: events.title,
      description: events.description,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      location: events.location,
      createdBy: events.createdBy,
      committeeMemberName: committeeMembers.name,
      createdAt: events.createdAt,
    }).from(events)
      .leftJoin(committeeMembers, eq(events.createdBy, committeeMembers.id))
      .orderBy(desc(events.eventDate));

    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query = query.where(gte(events.eventDate, today));
    }

    const eventsList = await query;
    res.json(eventsList);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [event] = await db.select({
      id: events.id,
      title: events.title,
      description: events.description,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      location: events.location,
      createdBy: events.createdBy,
      committeeMemberName: committeeMembers.name,
      createdAt: events.createdAt,
    }).from(events)
      .leftJoin(committeeMembers, eq(events.createdBy, committeeMembers.id))
      .where(eq(events.id, id));

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const { title, description, eventDate, eventTime, location } = req.body;

    const [newEvent] = await db.insert(events).values({
      title,
      description,
      eventDate,
      eventTime,
      location,
    }).returning();

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, eventDate, eventTime, location } = req.body;

    const [updatedEvent] = await db.update(events)
      .set({ title, description, eventDate, eventTime, location })
      .where(eq(events.id, id))
      .returning();

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(events).where(eq(events.id, req.params.id));
    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
