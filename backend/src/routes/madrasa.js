const express = require('express');
const { db } = require('../db');
const { madrasaStudents, madrasaAttendance, families } = require('../db/schema');
const { eq, and, gte, lte } = require('drizzle-orm');

const router = express.Router();

// Get all students
router.get('/students', async (req, res) => {
  try {
    const { classLevel } = req.query;
    let query = db.select({
      id: madrasaStudents.id,
      name: madrasaStudents.name,
      guardianName: madrasaStudents.guardianName,
      guardianPhone: madrasaStudents.guardianPhone,
      familyId: madrasaStudents.familyId,
      classLevel: madrasaStudents.classLevel,
      ustadName: madrasaStudents.ustadName,
      progressNotes: madrasaStudents.progressNotes,
      photoUrl: madrasaStudents.photoUrl,
    }).from(madrasaStudents);

    if (classLevel) {
      query = query.where(eq(madrasaStudents.classLevel, classLevel));
    }

    const students = await query;
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get single student with attendance
router.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [student] = await db.select().from(madrasaStudents).where(eq(madrasaStudents.id, id));
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get attendance
    const attendance = await db.select().from(madrasaAttendance)
      .where(eq(madrasaAttendance.studentId, id))
      .orderBy(madrasaAttendance.date);

    res.json({ student, attendance });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create student
router.post('/students', async (req, res) => {
  try {
    const { name, guardianName, guardianPhone, familyId, classLevel, ustadName, progressNotes, photoUrl } = req.body;

    const [newStudent] = await db.insert(madrasaStudents).values({
      name,
      guardianName,
      guardianPhone,
      familyId,
      classLevel,
      ustadName,
      progressNotes,
      photoUrl,
    }).returning();

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
router.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, guardianName, guardianPhone, familyId, classLevel, ustadName, progressNotes, photoUrl } = req.body;

    const [updatedStudent] = await db.update(madrasaStudents)
      .set({ name, guardianName, guardianPhone, familyId, classLevel, ustadName, progressNotes, photoUrl })
      .where(eq(madrasaStudents.id, id))
      .returning();

    res.json(updatedStudent);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/students/:id', async (req, res) => {
  try {
    await db.delete(madrasaStudents).where(eq(madrasaStudents.id, req.params.id));
    res.json({ message: 'Student deleted' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Mark attendance
router.post('/attendance', async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    // Check if attendance already exists
    const [existing] = await db.select().from(madrasaAttendance)
      .where(and(
        eq(madrasaAttendance.studentId, studentId),
        eq(madrasaAttendance.date, date)
      ));

    if (existing) {
      // Update existing
      const [updated] = await db.update(madrasaAttendance)
        .set({ status })
        .where(eq(madrasaAttendance.id, existing.id))
        .returning();
      res.json(updated);
    } else {
      // Create new
      const [newAttendance] = await db.insert(madrasaAttendance).values({
        studentId,
        date,
        status,
      }).returning();
      res.status(201).json(newAttendance);
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get attendance by date range
router.get('/attendance', auth, async (req, res) => {
  try {
    const { startDate, endDate, studentId } = req.query;
    
    let query = db.select().from(madrasaAttendance);
    
    const conditions = [];
    if (startDate) conditions.push(gte(madrasaAttendance.date, startDate));
    if (endDate) conditions.push(lte(madrasaAttendance.date, endDate));
    if (studentId) conditions.push(eq(madrasaAttendance.studentId, parseInt(studentId)));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const attendance = await query.orderBy(madrasaAttendance.date);
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

module.exports = router;
