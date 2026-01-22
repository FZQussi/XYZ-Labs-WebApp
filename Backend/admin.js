const express = require('express');
const path = require('path');
const auth = require('./middlewares/auth.middleware');
const admin = require('./middlewares/admin.middleware');

const router = express.Router();

router.get('/dashboard', auth, admin, (req, res) => {
  res.sendFile(
    path.join(__dirname, '../Frontend/Dashboard/html/dashboard.html')
  );
});

router.get('/me', auth, admin, (req, res) => {
  res.json(req.user);
});

module.exports = router;
