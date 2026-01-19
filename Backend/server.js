// backend/server.js
const express = require('express');
const cors = require('cors'); // permite comunicação com o frontend
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Importa funções de produtos do db
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require('./products');

// Middlewares
app.use(cors());           // habilita CORS
app.use(express.json());   // para receber JSON no body

// ================== ROTAS DE PRODUTOS ==================

// Listar todos os produtos
app.get('/products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
});

// Obter um produto pelo ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
});

// Criar um novo produto
app.post('/products', async (req, res) => {
  try {
    const newProduct = await createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Atualizar um produto existente
app.put('/products/:id', async (req, res) => {
  try {
    const updatedProduct = await updateProduct(req.params.id, req.body);
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Apagar um produto
app.delete('/products/:id', async (req, res) => {
  try {
    const result = await deleteProduct(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json({ message: 'Produto apagado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao apagar produto' });
  }
});

// ========================================================

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
app.get('/', (req, res) => {
  res.send('Servidor backend está a funcionar!');
});
