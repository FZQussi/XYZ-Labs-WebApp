const client = require('./db');

async function getMaterials() {
  const res = await client.query('SELECT * FROM materials ORDER BY id');
  return res.rows;
}

module.exports = { getMaterials };
