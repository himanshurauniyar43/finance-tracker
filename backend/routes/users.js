const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(authenticateToken);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

module.exports = router;