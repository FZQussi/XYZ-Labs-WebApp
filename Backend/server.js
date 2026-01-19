// server.js
require('dotenv').config();
const express = require('express');
const { Client } = require('pg');

const app = express();
app.use(express.json());

// Configurar a conexão com o PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

// Conectar ao banco
client.connect()
  .then(() => console.log('Ligação ao PostgreSQL OK!'))
  .catch(err => console.error('Erro na ligação:', err));

// Rota exemplo: listar produtos
app.get('/products', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM "Product"');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Iniciar servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
