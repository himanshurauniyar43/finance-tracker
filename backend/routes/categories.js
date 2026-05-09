const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');
const { getRedisClient } = require('../config/redis');

router.use(authenticateToken);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     security:
 *       - bearerAuth: []
 */
router.get('/', async (req, res, next) => {
  try {
    // Try cache first
    const redisClient = getRedisClient();
    if (redisClient) {
      const cachedCategories = await redisClient.get('categories:all');
      if (cachedCategories) {
        return res.json({ success: true, data: JSON.parse(cachedCategories) });
      }
    }

    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');

    // Cache for 1 hour
    if (redisClient) {
      await redisClient.setEx('categories:all', 3600, JSON.stringify(categories));
    }

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

module.exports = router;