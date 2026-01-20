const client = require('./db');

async function getColors() {
  const res = await client.query('SELECT * FROM colors ORDER BY id');
  return res.rows;
}

module.exports = { getColors };
