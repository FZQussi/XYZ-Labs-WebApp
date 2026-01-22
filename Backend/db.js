const { Pool } = require('pg');
require('dotenv').config();

const client = new Pool({
  connectionString: process.env.DATABASE_URL,
});

client.connect()
  .then(() => console.log('Ligação ao PostgreSQL OK!'))
  .catch(err => console.error('Erro PostgreSQL:', err));

module.exports = client;
