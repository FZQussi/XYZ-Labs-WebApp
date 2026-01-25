// Backend/routes/contact.routes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('../controllers/contact.controller');

const router = express.Router();

// Configurar upload para ficheiros de contacto
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/contact');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|stl|obj|3mf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype === 'application/octet-stream'; // Para .stl, .obj

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Tipo de ficheiro não permitido'));
  }
});

// POST /contact - Enviar mensagem de contacto
router.post('/', upload.array('files', 5), controller.sendContactMessage);

module.exports = router;