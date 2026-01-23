const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const productRoutes = require('./routes/products.routes');
const userRoutes = require('./routes/users.routes');
const categoriesRoutes = require('./routes/categories.routes');
const subcategoriesRoutes = require('./routes/subcategories.routes');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/models', express.static(path.join(__dirname, '../Frontend/models')));
app.use('/categories', categoriesRoutes);
app.use('/subcategories', subcategoriesRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);

app.get('/', (_, res) => {
  res.send('Backend a funcionar 🚀');
});

app.listen(port, () => {
  console.log(`Servidor em http://localhost:${port}`);
});
