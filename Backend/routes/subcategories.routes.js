const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /subcategories
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM subcategories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar subcategorias' });
  }
});

module.exports = router;
