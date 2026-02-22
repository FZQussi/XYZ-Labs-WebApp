const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Função para sanitizar nomes de ficheiros
function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')          // espaços viram underscore
    .replace(/[^a-z0-9_\-\.]/g, ''); // remove caracteres especiais
}

// MODELO 3D
const storageModels = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../Frontend/models');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname);
    cb(null, `model_${Date.now()}_${sanitized}`);
  }
});

// IMAGENS
const storageImages = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../Frontend/images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname);

    // Se tivermos o ID do produto já no body, usamos
    const productId = req.body.productId || Date.now();

    cb(null, `prod${productId}_${Date.now()}_${sanitized}`);
  }
});

// Criar instâncias multer separadas
const uploadModels = multer({ storage: storageModels });
const uploadImages = multer({ storage: storageImages });

module.exports = { uploadModels, uploadImages };
