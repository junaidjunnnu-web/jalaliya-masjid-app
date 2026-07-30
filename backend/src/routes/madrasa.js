const express = require('express');
const { db } = require('../db');
const { ustads, madrasaStudents, madrasaAttendance } = require('../db/schema');
const { eq, and, gte, lte, desc } = require('drizzle-orm');
const bcrypt = require('bcrypt');

const router = express.Router();

// Get all ustads
router.get('/ustads', async (req, res) => {
  try {
    const ustadsList = await db.select({
      id: ustads.id,
      name: ustads.name,
      createdAt: ustads.createdAt,
    }).from(ustads);
    res.json(ustadsList);
  } catch (error) {
    console.error('Get ustads error:', error);
    res.status(500).json({ error: 'Failed to fetch ustads' });
  }
});

// Verify Ustad PIN
router.post('/ustads/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    
    const ustadsList = await db.select().from(ustads);
    
    for (const ustad of ustadsList) {
      const isValid = await bcrypt.compare(pin, ustad.pinHash);
      if (isValid) {
        return res.json({ valid: true, ustadId: ustad.id, ustadName: ustad.name });
      }
    }
    
    res.json({ valid: false });
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({ error: 'Failed to verify PIN' });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const { standard, search } = req.query;
    let query = db.select({
      id: madrasaStudents.id,
      name: madrasaStudents.name,
      standard: madrasaStudents.standard,
      fatherName: madrasaStudents.fatherName,
      fatherPhone: madrasaStudents.fatherPhone,
      createdAt: madrasaStudents.createdAt,
    }).from(madrasaStudents);

    if (standard) {
      query = query.where(eq(madrasaStudents.standard, standard));
    }

    if (search) {
      query = query.where(eq(madrasaStudents.name, search));
    }

    const students = await query.orderBy(madrasaStudents.name);
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Search students by name
router.get('/students/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    const students = await db.select({
      id: madrasaStudents.id,
      name: madrasaStudents.name,
      standard: madrasaStudents.standard,
      fatherName: madrasaStudents.fatherName,
      fatherPhone: madrasaStudents.fatherPhone,
      createdAt: madrasaStudents.createdAt,
    }).from(madrasaStudents)
      .where(eq(madrasaStudents.name, q));

    res.json(students);
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({ error: 'Failed to search students' });
  }
});

// Get single student with attendance history
router.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [student] = await db.select().from(madrasaStudents).where(eq(madrasaStudents.id, id));
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get attendance history
    const attendance = await db.select({
      id: madrasaAttendance.id,
      date: madrasaAttendance.date,
      status: madrasaAttendance.status,
      markedByUstadId: madrasaAttendance.markedByUstadId,
      createdAt: madrasaAttendance.createdAt,
    }).from(madrasaAttendance)
      .where(eq(madrasaAttendance.studentId, id))
      .orderBy(desc(madrasaAttendance.date));

    // Calculate attendance summary for current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthAttendance = attendance.filter(a => {
      const attDate = new Date(a.date);
      return attDate.getMonth() === currentMonth && attDate.getFullYear() === currentYear;
    });
    
    const presentCount = monthAttendance.filter(a => a.status === 'present').length;
    const totalCount = monthAttendance.length;

    res.json({ 
      student, 
      attendance,
      attendanceSummary: {
        present: presentCount,
        total: totalCount,
        month: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create student
router.post('/students', async (req, res) => {
  try {
    const { name, standard, fatherName, fatherPhone } = req.body;

    const [newStudent] = await db.insert(madrasaStudents).values({
      name,
      standard,
      fatherName,
      fatherPhone,
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
    const { name, standard, fatherName, fatherPhone } = req.body;

    const [updatedStudent] = await db.update(madrasaStudents)
      .set({ name, standard, fatherName, fatherPhone })
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

// Mark attendance (requires Ustad PIN verification)
router.post('/attendance', async (req, res) => {
  try {
    const { studentId, date, status, ustadId } = req.body;

    // Check if attendance already exists
    const [existing] = await db.select().from(madrasaAttendance)
      .where(and(
        eq(madrasaAttendance.studentId, studentId),
        eq(madrasaAttendance.date, date)
      ));

    if (existing) {
      // Update existing
      const [updated] = await db.update(madrasaAttendance)
        .set({ status, markedByUstadId: ustadId })
        .where(eq(madrasaAttendance.id, existing.id))
        .returning();
      res.json(updated);
    } else {
      // Create new
      const [newAttendance] = await db.insert(madrasaAttendance).values({
        studentId,
        date,
        status,
        markedByUstadId: ustadId,
      }).returning();
      res.status(201).json(newAttendance);
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get attendance by date range
router.get('/attendance', async (req, res) => {
  try {
    const { startDate, endDate, studentId, standard } = req.query;
    
    let query = db.select({
      id: madrasaAttendance.id,
      studentId: madrasaAttendance.studentId,
      date: madrasaAttendance.date,
      status: madrasaAttendance.status,
      markedByUstadId: madrasaAttendance.markedByUstadId,
      createdAt: madrasaAttendance.createdAt,
    }).from(madrasaAttendance);
    
    const conditions = [];
    if (startDate) conditions.push(gte(madrasaAttendance.date, startDate));
    if (endDate) conditions.push(lte(madrasaAttendance.date, endDate));
    if (studentId) conditions.push(eq(madrasaAttendance.studentId, parseInt(studentId)));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const attendance = await query.orderBy(desc(madrasaAttendance.date));
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

module.exports = router;

