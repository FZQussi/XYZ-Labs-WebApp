// backend/server.js
const express = require('express');
const cors = require('cors'); 
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Importa rotas de autenticação
const authRoutes = require('./auth');

const { getMaterials } = require('./materials');
const { getColors } = require('./colors');
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require('./products');

const app = express();
const port = process.env.PORT || 3001;

// ======== CONFIG MULTER PARA UPLOAD DE GLB ========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../Frontend/models');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // mantém o nome original do ficheiro
  }
});
const upload = multer({ storage });

// ======== MIDDLEWARES ========
app.use(cors());
app.use(express.json());
app.use('/models', express.static(path.join(__dirname, '../Frontend/models'))); // para servir os GLBs

// ======== ROTAS DE AUTENTICAÇÃO ========
app.use('/auth', authRoutes); // <--- agora está correto

// ================== ROTAS DE MATERIAIS E CORES ==================
app.get('/materials', async (req, res) => {
  try {
    const materials = await getMaterials();
    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter materiais' });
  }
});

app.get('/colors', async (req, res) => {
  try {
    const colors = await getColors();
    res.json(colors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter cores' });
  }
});

// ================== ROTAS DE PRODUTOS ==================
app.get('/products', async (req, res) => {
  try {
    const products = await getProducts(); // deve trazer material_name e color_name
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
});

// ================== CRIAR PRODUTO COM UPLOAD ==================
app.post('/products', upload.single('modelFile'), async (req, res) => {
  try {
    const { name, description, price } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Ficheiro .glb obrigatório' });
    }

    const newProduct = await createProduct({
      name,
      description,
      price: parseFloat(price),
      model_file: req.file.filename
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// ================== ATUALIZAR PRODUTO COM UPLOAD ==================
app.put('/products/:id', upload.single('modelFile'), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const modelFile = req.file ? req.file.filename : undefined;

    const updatedProduct = await updateProduct(req.params.id, {
      name,
      description,
      price: parseFloat(price),
      model_file: modelFile
    });

    if (!updatedProduct) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// ================== DELETE PRODUTO ==================
app.delete('/products/:id', async (req, res) => {
  try {
    const result = await deleteProduct(req.params.id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao apagar produto' });
  }
});

// ================== ROTA DE TESTE ==================
app.get('/', (req, res) => {
  res.send('Servidor backend está a funcionar!');
});

// ================== INICIA SERVIDOR ==================
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
