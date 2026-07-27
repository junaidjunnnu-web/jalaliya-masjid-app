const express = require('express');
const { db } = require('../db');
const { monthlyFees, families, familyMembers, committeeMembers } = require('../db/schema');
const { eq, desc, and, gte, lte, sum } = require('drizzle-orm');
const { auth, committeeOnly } = require('../middleware/auth');

const router = express.Router();

// Helper: Calculate fee for a family
const calculateFamilyFee = async (familyId) => {
  const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId));
  
  let marriedCount = 0;
  let unmarriedCount = 0;
  
  members.forEach(member => {
    if (member.isFeeApplicable && member.age >= 18) {
      if (member.maritalStatus === 'married') {
        marriedCount++;
      } else {
        unmarriedCount++;
      }
    }
  });
  
  const [family] = await db.select().from(families).where(eq(families.id, familyId));
  
  return {
    marriedCount,
    unmarriedCount,
    calculatedFee: (marriedCount * family.monthlyFeeMarried) + (unmarriedCount * family.monthlyFeeUnmarried),
  };
};

// Get monthly fees for a family
router.get('/family/:familyId', auth, async (req, res) => {
  try {
    const { familyId } = req.params;
    const userRole = req.user.role;
    const userFamilyId = req.user.familyId;

    // Members can only view their own fees
    if (userRole === 'member' && parseInt(familyId) !== userFamilyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fees = await db.select({
      id: monthlyFees.id,
      familyId: monthlyFees.familyId,
      month: monthlyFees.month,
      calculatedFee: monthlyFees.calculatedFee,
      openingBalance: monthlyFees.openingBalance,
      totalDue: monthlyFees.totalDue,
      amountPaid: monthlyFees.amountPaid,
      closingBalance: monthlyFees.closingBalance,
      status: monthlyFees.status,
      paidDate: monthlyFees.paidDate,
      collectedBy: monthlyFees.collectedBy,
      committeeMemberName: committeeMembers.name,
      note: monthlyFees.note,
    }).from(monthlyFees)
      .leftJoin(committeeMembers, eq(monthlyFees.collectedBy, committeeMembers.id))
      .where(eq(monthlyFees.familyId, familyId))
      .orderBy(desc(monthlyFees.month));

    res.json(fees);
  } catch (error) {
    console.error('Get family fees error:', error);
    res.status(500).json({ error: 'Failed to fetch family fees' });
  }
});

// Get all monthly fees for a month (committee only)
router.get('/month/:month', auth, committeeOnly, async (req, res) => {
  try {
    const { month } = req.params;

    const fees = await db.select({
      id: monthlyFees.id,
      familyId: monthlyFees.familyId,
      familyHeadName: families.headName,
      familyHeadPhone: families.headPhone,
      placeName: families.placeId, // Will need to join with places
      month: monthlyFees.month,
      calculatedFee: monthlyFees.calculatedFee,
      openingBalance: monthlyFees.openingBalance,
      totalDue: monthlyFees.totalDue,
      amountPaid: monthlyFees.amountPaid,
      closingBalance: monthlyFees.closingBalance,
      status: monthlyFees.status,
      paidDate: monthlyFees.paidDate,
      collectedBy: monthlyFees.collectedBy,
      committeeMemberName: committeeMembers.name,
      note: monthlyFees.note,
    }).from(monthlyFees)
      .leftJoin(families, eq(monthlyFees.familyId, families.id))
      .leftJoin(committeeMembers, eq(monthlyFees.collectedBy, committeeMembers.id))
      .where(eq(monthlyFees.month, month));

    res.json(fees);
  } catch (error) {
    console.error('Get month fees error:', error);
    res.status(500).json({ error: 'Failed to fetch month fees' });
  }
});

// Get fee summary for a month (committee only)
router.get('/summary/:month', auth, committeeOnly, async (req, res) => {
  try {
    const { month } = req.params;

    const fees = await db.select().from(monthlyFees).where(eq(monthlyFees.month, month));

    const totalFamilies = fees.length;
    const paidFamilies = fees.filter(f => f.status === 'paid').length;
    const partialFamilies = fees.filter(f => f.status === 'partial').length;
    const unpaidFamilies = fees.filter(f => f.status === 'unpaid').length;
    
    const totalCollected = fees.reduce((sum, f) => sum + f.amountPaid, 0);
    const totalPending = fees.reduce((sum, f) => sum + f.closingBalance, 0);

    res.json({
      totalFamilies,
      paidFamilies,
      partialFamilies,
      unpaidFamilies,
      totalCollected,
      totalPending,
    });
  } catch (error) {
    console.error('Get fee summary error:', error);
    res.status(500).json({ error: 'Failed to fetch fee summary' });
  }
});

// Generate monthly fees for all families (committee only)
router.post('/generate/:month', auth, committeeOnly, async (req, res) => {
  try {
    const { month } = req.params;

    // Get all approved families
    const allFamilies = await db.select().from(families).where(eq(families.status, 'approved'));

    const results = [];

    for (const family of allFamilies) {
      // Check if fee already exists for this month
      const [existing] = await db.select().from(monthlyFees)
        .where(and(
          eq(monthlyFees.familyId, family.id),
          eq(monthlyFees.month, month)
        ));

      if (existing) {
        results.push({ familyId: family.id, status: 'already_exists' });
        continue;
      }

      // Calculate fee
      const { calculatedFee } = await calculateFamilyFee(family.id);

      // Get previous month's closing balance
      const prevMonth = getPreviousMonth(month);
      const [prevFee] = await db.select().from(monthlyFees)
        .where(and(
          eq(monthlyFees.familyId, family.id),
          eq(monthlyFees.month, prevMonth)
        ));

      const openingBalance = prevFee ? prevFee.closingBalance : 0;
      const totalDue = calculatedFee + openingBalance;

      const [newFee] = await db.insert(monthlyFees).values({
        familyId: family.id,
        month,
        calculatedFee,
        openingBalance,
        totalDue,
        amountPaid: 0,
        closingBalance: totalDue,
        status: 'unpaid',
      }).returning();

      results.push({ familyId: family.id, status: 'created', fee: newFee });
    }

    res.json({ results });
  } catch (error) {
    console.error('Generate fees error:', error);
    res.status(500).json({ error: 'Failed to generate fees' });
  }
});

// Update payment (committee only)
router.patch('/:id/payment', auth, committeeOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paidDate, note } = req.body;

    const [fee] = await db.select().from(monthlyFees).where(eq(monthlyFees.id, id));
    
    if (!fee) {
      return res.status(404).json({ error: 'Fee record not found' });
    }

    const newAmountPaid = fee.amountPaid + amountPaid;
    const newClosingBalance = fee.totalDue - newAmountPaid;
    const newStatus = newClosingBalance === 0 ? 'paid' : (newAmountPaid > 0 ? 'partial' : 'unpaid');

    const [updatedFee] = await db.update(monthlyFees)
      .set({
        amountPaid: newAmountPaid,
        closingBalance: newClosingBalance,
        status: newStatus,
        paidDate: paidDate || new Date().toISOString().split('T')[0],
        collectedBy: req.user.committeeMemberId,
        note,
      })
      .where(eq(monthlyFees.id, id))
      .returning();

    res.json(updatedFee);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Helper: Get previous month string (YYYY-MM)
function getPreviousMonth(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 7);
}

module.exports = router;
