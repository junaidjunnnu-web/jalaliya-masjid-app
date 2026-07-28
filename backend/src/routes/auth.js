const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { users, families, committeeMembers } = require('../db/schema');
const { eq } = require('drizzle-orm');

const router = express.Router();

// Register (new member self-registration)
router.post('/register', async (req, res) => {
  try {
    const { phone, pin, headName, placeId, address } = req.body;

    console.log('📝 REGISTER REQUEST:', { phone, headName, placeId });

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.phone, phone));
    if (existingUser.length > 0) {
      console.log('❌ REGISTER FAILED: Phone already registered', phone);
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);
    console.log('🔐 PIN hashed for phone:', phone);

    // Create family with pending status
    const [newFamily] = await db.insert(families).values({
      headName,
      headPhone: phone,
      placeId,
      address,
      status: 'pending',
    }).returning();
    console.log('👨‍👩‍👧‍👦 Family created:', { id: newFamily.id, headName });

    // Create user
    const [newUser] = await db.insert(users).values({
      phone,
      pinHash,
      role: 'member',
      familyId: newFamily.id,
    }).returning();
    console.log('👤 User created:', { id: newUser.id, phone: newUser.phone, role: newUser.role });

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, phone: newUser.phone, role: newUser.role, familyId: newUser.familyId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    console.log('🎫 Token generated for user:', newUser.id);

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
    console.error('❌ REGISTER ERROR:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    console.log('🔑 LOGIN REQUEST:', { phone });

    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    if (!user) {
      console.log('❌ LOGIN FAILED: User not found', phone);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('👤 User found:', { id: user.id, phone: user.phone, role: user.role });

    const validPin = await bcrypt.compare(pin, user.pinHash);
    if (!validPin) {
      console.log('❌ LOGIN FAILED: Invalid PIN for user', user.id);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ PIN validated for user:', user.id);

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, familyId: user.familyId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    console.log('🎫 Token generated for user:', user.id);

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
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user (disabled - no auth)
router.get('/me', async (req, res) => {
  res.json({ user: null, family: null, committeeMember: null });
});

module.exports = router;
