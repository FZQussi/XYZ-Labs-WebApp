// backend/server.js
const express = require('express');
const cors = require('cors'); 
require('dotenv').config();

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

// Middlewares
app.use(cors());
app.use(express.json());

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
    const products = await getProducts();
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

app.post('/products', async (req, res) => {
  try {
    const newProduct = await createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const updatedProduct = await updateProduct(req.params.id, req.body);
    if (!updatedProduct) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const result = await deleteProduct(req.params.id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao apagar produto' });
  }
});

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor backend está a funcionar!');
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
