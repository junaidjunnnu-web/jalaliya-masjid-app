const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { db } = require('../db');
const { galleryPhotos, events, committeeMembers } = require('../db/schema');
const { eq, desc } = require('drizzle-orm');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all gallery photos (public)
router.get('/', async (req, res) => {
  try {
    const { category, eventId } = req.query;
    let query = db.select({
      id: galleryPhotos.id,
      photoUrl: galleryPhotos.photoUrl,
      category: galleryPhotos.category,
      caption: galleryPhotos.caption,
      eventId: galleryPhotos.eventId,
      eventTitle: events.title,
      uploadedBy: galleryPhotos.uploadedBy,
      committeeMemberName: committeeMembers.name,
      createdAt: galleryPhotos.createdAt,
    }).from(galleryPhotos)
      .leftJoin(events, eq(galleryPhotos.eventId, events.id))
      .leftJoin(committeeMembers, eq(galleryPhotos.uploadedBy, committeeMembers.id))
      .orderBy(desc(galleryPhotos.createdAt));

    if (category) {
      query = query.where(eq(galleryPhotos.category, category));
    }

    if (eventId) {
      query = query.where(eq(galleryPhotos.eventId, parseInt(eventId)));
    }

    const photos = await query;
    res.json(photos);
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery photos' });
  }
});

// Get single photo
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [photo] = await db.select({
      id: galleryPhotos.id,
      photoUrl: galleryPhotos.photoUrl,
      category: galleryPhotos.category,
      caption: galleryPhotos.caption,
      eventId: galleryPhotos.eventId,
      eventTitle: events.title,
      uploadedBy: galleryPhotos.uploadedBy,
      committeeMemberName: committeeMembers.name,
      createdAt: galleryPhotos.createdAt,
    }).from(galleryPhotos)
      .leftJoin(events, eq(galleryPhotos.eventId, events.id))
      .leftJoin(committeeMembers, eq(galleryPhotos.uploadedBy, committeeMembers.id))
      .where(eq(galleryPhotos.id, id));

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(photo);
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Upload photo
router.post('/', async (req, res) => {
  try {
    const { photoBase64, category, caption, eventId } = req.body;

    // Upload to Supabase Storage
    const fileName = `gallery/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const { data, error: uploadError } = await supabase.storage
      .from('jalaliya-masjid')
      .upload(fileName, Buffer.from(photoBase64, 'base64'), {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload photo' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('jalaliya-masjid')
      .getPublicUrl(fileName);

    // Save to database
    const [newPhoto] = await db.insert(galleryPhotos).values({
      photoUrl: publicUrl,
      category,
      caption,
      eventId: eventId || null,
    }).returning();

    res.status(201).json(newPhoto);
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Update photo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, caption, eventId } = req.body;

    const [updatedPhoto] = await db.update(galleryPhotos)
      .set({ category, caption, eventId })
      .where(eq(galleryPhotos.id, id))
      .returning();

    res.json(updatedPhoto);
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Delete photo
router.delete('/:id', async (req, res) => {
  try {
    // Get photo URL to delete from Supabase
    const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, req.params.id));
    
    if (photo && photo.photoUrl) {
      // Extract filename from URL
      const fileName = photo.photoUrl.split('/').pop();
      await supabase.storage.from('jalaliya-masjid').remove([`gallery/${fileName}`]);
    }

    await db.delete(galleryPhotos).where(eq(galleryPhotos.id, req.params.id));
    res.json({ message: 'Photo deleted' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

module.exports = router;
