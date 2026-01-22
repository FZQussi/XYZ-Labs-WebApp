const express = require('express');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const client = require('../db');

const router = express.Router();

router.get('/', auth, admin, async (req, res) => {
  const result = await client.query(
    'SELECT id,name,email,role,created_at FROM users'
  );
  res.json(result.rows);
});

router.delete('/:id', auth, admin, async (req, res) => {
  await client.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
