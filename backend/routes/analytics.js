const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimiter');
const { getRedisClient } = require('../config/redis');

router.use(authenticateToken);

// Cache middleware
const cacheMiddleware = (duration = 900) => {
  return async (req, res, next) => {
    try {
      const redisClient = getRedisClient();
      if (!redisClient) return next();

      const key = `analytics:${req.user.id}:${req.originalUrl}`;
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      const originalJson = res.json.bind(res);
      res.json = (data) => {
        redisClient.setEx(key, duration, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * @swagger
 * /api/analytics/monthly:
 *   get:
 *     tags: [Analytics]
 *     summary: Get monthly analytics
 *     security:
 *       - bearerAuth: []
 */
router.get('/monthly', analyticsLimiter, cacheMiddleware(900), async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    let query = `
      SELECT 
        MONTH(transaction_date) as month,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE YEAR(transaction_date) = ?
    `;
    const params = [year];

    if (req.user.role !== 'admin') {
      query += ` AND user_id = ?`;
      params.push(req.user.id);
    }

    query += ` GROUP BY MONTH(transaction_date), type ORDER BY month, type`;

    const [rows] = await pool.query(query, params);

    // Transform data
    const monthlyData = {};
    rows.forEach(row => {
      const month = parseInt(row.month);
      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, expense: 0 };
      }
      monthlyData[month][row.type] = parseFloat(row.total);
    });

    res.json({
      success: true,
      data: Object.values(monthlyData)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/categories:
 *   get:
 *     tags: [Analytics]
 *     summary: Get category-wise breakdown
 *     security:
 *       - bearerAuth: []
 */
router.get('/categories', analyticsLimiter, cacheMiddleware(900), async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || (currentDate.getMonth() + 1);

    let query = `
      SELECT 
        c.name,
        c.icon,
        c.type,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE YEAR(t.transaction_date) = ?
      AND MONTH(t.transaction_date) = ?
    `;
    const params = [targetYear, targetMonth];

    if (req.user.role !== 'admin') {
      query += ` AND t.user_id = ?`;
      params.push(req.user.id);
    }

    query += ` GROUP BY c.name, c.icon, c.type ORDER BY total DESC`;

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows.map(row => ({
        ...row,
        total: parseFloat(row.total)
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     tags: [Analytics]
 *     summary: Get income vs expense trends
 *     security:
 *       - bearerAuth: []
 */
router.get('/trends', analyticsLimiter, cacheMiddleware(900), async (req, res, next) => {
  try {
    const { months = 6 } = req.query;

    let query = `
      SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') as month,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    `;
    const params = [parseInt(months)];

    if (req.user.role !== 'admin') {
      query += ` AND user_id = ?`;
      params.push(req.user.id);
    }

    query += ` GROUP BY DATE_FORMAT(transaction_date, '%Y-%m'), type ORDER BY month`;

    const [rows] = await pool.query(query, params);

    // Transform data
    const trends = {};
    rows.forEach(row => {
      if (!trends[row.month]) {
        trends[row.month] = { month: row.month, income: 0, expense: 0 };
      }
      trends[row.month][row.type] = parseFloat(row.total);
    });

    res.json({
      success: true,
      data: Object.values(trends)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;