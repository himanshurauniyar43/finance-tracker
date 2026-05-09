const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { transactionValidation, validate } = require('../utils/validation');
const { transactionLimiter } = require('../middleware/rateLimiter');
const { getRedisClient } = require('../config/redis');

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Get all transactions (filtered by user role)
 *     security:
 *       - bearerAuth: []
 */
router.get('/', transactionLimiter, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, category, search, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) as total FROM transactions t WHERE 1=1`;
    const params = [];
    const countParams = [];

    // RBAC: admin sees all, others see only their own
    if (req.user.role !== 'admin') {
      query += ` AND t.user_id = ?`;
      countQuery += ` AND t.user_id = ?`;
      params.push(req.user.id);
      countParams.push(req.user.id);
    }

    if (type) {
      query += ` AND t.type = ?`;
      countQuery += ` AND t.type = ?`;
      params.push(type);
      countParams.push(type);
    }

    if (category) {
      query += ` AND t.category_id = ?`;
      countQuery += ` AND t.category_id = ?`;
      params.push(category);
      countParams.push(category);
    }

    if (search) {
      query += ` AND t.description LIKE ?`;
      countQuery += ` AND t.description LIKE ?`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    if (startDate) {
      query += ` AND t.transaction_date >= ?`;
      countQuery += ` AND t.transaction_date >= ?`;
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      query += ` AND t.transaction_date <= ?`;
      countQuery += ` AND t.transaction_date <= ?`;
      params.push(endDate);
      countParams.push(endDate);
    }

    // Get total count
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Get paginated results
    query += ` ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [transactions] = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Create a new transaction (admin, user only)
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authorize('admin', 'user'), transactionLimiter, transactionValidation, validate, async (req, res, next) => {
  try {
    const { amount, type, category_id, description, date } = req.body;

    const [result] = await pool.query(
      `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, category_id, amount, type, description, date]
    );

    // Get the created transaction
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE id = ?',
      [result.insertId]
    );

    // Clear cache for this user's analytics
    try {
      const redisClient = getRedisClient();
      if (redisClient) {
        const keys = await redisClient.keys(`analytics:${req.user.id}:*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }

    res.status(201).json({
      success: true,
      data: transactions[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     tags: [Transactions]
 *     summary: Update a transaction (admin, user only)
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authorize('admin', 'user'), transactionValidation, validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, type, category_id, description, date } = req.body;

    let query;
    let params;

    if (req.user.role === 'admin') {
      query = `UPDATE transactions 
         SET amount = ?, type = ?, category_id = ?, description = ?, transaction_date = ?
         WHERE id = ?`;
      params = [amount, type, category_id, description, date, id];
    } else {
      query = `UPDATE transactions 
         SET amount = ?, type = ?, category_id = ?, description = ?, transaction_date = ?
         WHERE id = ? AND user_id = ?`;
      params = [amount, type, category_id, description, date, id, req.user.id];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Get updated transaction
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);

    // Clear cache
    try {
      const redisClient = getRedisClient();
      if (redisClient) {
        const keys = await redisClient.keys(`analytics:${req.user.id}:*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }

    res.json({ success: true, data: transactions[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     tags: [Transactions]
 *     summary: Delete a transaction (admin, user only)
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authorize('admin', 'user'), async (req, res, next) => {
  try {
    const { id } = req.params;

    let query;
    let params;

    if (req.user.role === 'admin') {
      query = 'DELETE FROM transactions WHERE id = ?';
      params = [id];
    } else {
      query = 'DELETE FROM transactions WHERE id = ? AND user_id = ?';
      params = [id, req.user.id];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Clear cache
    try {
      const redisClient = getRedisClient();
      if (redisClient) {
        const keys = await redisClient.keys(`analytics:${req.user.id}:*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;