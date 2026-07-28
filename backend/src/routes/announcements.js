const express = require('express');
const { db } = require('../db');
const { announcements, committeeMembers } = require('../db/schema');
const { eq, desc } = require('drizzle-orm');

const router = express.Router();

// Get all announcements (public)
router.get('/', async (req, res) => {
  try {
    const announcementsList = await db.select({
      id: announcements.id,
      title: announcements.title,
      message: announcements.message,
      postedBy: announcements.postedBy,
      committeeMemberName: committeeMembers.name,
      createdAt: announcements.createdAt,
    }).from(announcements)
      .leftJoin(committeeMembers, eq(announcements.postedBy, committeeMembers.id))
      .orderBy(desc(announcements.createdAt));

    res.json(announcementsList);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get single announcement
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [announcement] = await db.select({
      id: announcements.id,
      title: announcements.title,
      message: announcements.message,
      postedBy: announcements.postedBy,
      committeeMemberName: committeeMembers.name,
      createdAt: announcements.createdAt,
    }).from(announcements)
      .leftJoin(committeeMembers, eq(announcements.postedBy, committeeMembers.id))
      .where(eq(announcements.id, id));

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Create announcement
router.post('/', async (req, res) => {
  try {
    const { title, message } = req.body;

    const [newAnnouncement] = await db.insert(announcements).values({
      title,
      message,
    }).returning();

    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message } = req.body;

    const [updatedAnnouncement] = await db.update(announcements)
      .set({ title, message })
      .where(eq(announcements.id, id))
      .returning();

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(announcements).where(eq(announcements.id, req.params.id));
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
