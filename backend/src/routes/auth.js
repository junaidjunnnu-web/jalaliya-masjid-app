const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { users, families, committeeMembers } = require('../db/schema');
const { eq } = require('drizzle-orm');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register (new member self-registration)
router.post('/register', async (req, res) => {
  try {
    const { phone, pin, headName, placeId, address } = req.body;

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.phone, phone));
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);

    // Create family with pending status
    const [newFamily] = await db.insert(families).values({
      headName,
      headPhone: phone,
      placeId,
      address,
      status: 'pending',
    }).returning();

    // Create user
    const [newUser] = await db.insert(users).values({
      phone,
      pinHash,
      role: 'member',
      familyId: newFamily.id,
    }).returning();

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, phone: newUser.phone, role: newUser.role, familyId: newUser.familyId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        phone: newUser.phone,
        role: newUser.role,
        familyId: newUser.familyId,
      },
      family: newFamily,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPin = await bcrypt.compare(pin, user.pinHash);
    if (!validPin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, familyId: user.familyId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        familyId: user.familyId,
        committeeMemberId: user.committeeMemberId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let familyData = null;
    let committeeData = null;

    if (user.familyId) {
      [familyData] = await db.select().from(families).where(eq(families.id, user.familyId));
    }

    if (user.committeeMemberId) {
      [committeeData] = await db.select().from(committeeMembers).where(eq(committeeMembers.id, user.committeeMemberId));
    }

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        familyId: user.familyId,
        committeeMemberId: user.committeeMemberId,
      },
      family: familyData,
      committeeMember: committeeData,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

module.exports = router;
