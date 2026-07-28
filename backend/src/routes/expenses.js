const express = require('express');
const { db } = require('../db');
const { expenses, committeeMembers } = require('../db/schema');
const { eq, desc, and, gte, lte } = require('drizzle-orm');

const router = express.Router();

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    let query = db.select({
      id: expenses.id,
      category: expenses.category,
      amount: expenses.amount,
      date: expenses.date,
      note: expenses.note,
      enteredBy: expenses.enteredBy,
      committeeMemberName: committeeMembers.name,
    }).from(expenses)
      .leftJoin(committeeMembers, eq(expenses.enteredBy, committeeMembers.id))
      .orderBy(desc(expenses.date));

    const conditions = [];
    if (category) conditions.push(eq(expenses.category, category));
    if (startDate) conditions.push(gte(expenses.date, startDate));
    if (endDate) conditions.push(lte(expenses.date, endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const expenseList = await query;
    res.json(expenseList);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get single expense
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [expense] = await db.select({
      id: expenses.id,
      category: expenses.category,
      amount: expenses.amount,
      date: expenses.date,
      note: expenses.note,
      enteredBy: expenses.enteredBy,
      committeeMemberName: committeeMembers.name,
    }).from(expenses)
      .leftJoin(committeeMembers, eq(expenses.enteredBy, committeeMembers.id))
      .where(eq(expenses.id, id));

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create expense
router.post('/', async (req, res) => {
  try {
    const { category, amount, date, note } = req.body;

    const [newExpense] = await db.insert(expenses).values({
      category,
      amount,
      date,
      note,
    }).returning();

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, date, note } = req.body;

    const [updatedExpense] = await db.update(expenses)
      .set({ category, amount, date, note })
      .where(eq(expenses.id, id))
      .returning();

    res.json(updatedExpense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(expenses).where(eq(expenses.id, req.params.id));
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Get summary by category
router.get('/summary/total', async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    
    let query = db.select({
      category: expenses.category,
      total: expenses.amount,
    }).from(expenses);

    const conditions = [];
    if (category) conditions.push(eq(expenses.category, category));
    if (startDate) conditions.push(gte(expenses.date, startDate));
    if (endDate) conditions.push(lte(expenses.date, endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;
    
    // Group by category and sum
    const summary = {};
    results.forEach(r => {
      if (!summary[r.category]) {
        summary[r.category] = 0;
      }
      summary[r.category] += r.total;
    });

    res.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
