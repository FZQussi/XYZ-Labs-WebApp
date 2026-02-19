const express = require('express');
  const cors = require('cors');
  require('dotenv').config();
  const path = require('path');

  const authRoutes = require('./auth');
  const adminRoutes = require('./admin');
  const productRoutes = require('./routes/products.routes');
  const userRoutes = require('./routes/users.routes');
  const categoriesRoutes = require('./routes/categories.routes');
  //const subcategoriesRoutes = require('./routes/subcategories.routes');
  const orderRoutes = require('./routes/orders.routes');
  const contactRoutes = require('./routes/contact.routes');
  const forgotRoutes = require('./routes/forgot.routes');
  const resetRoutes = require('./routes/reset.routes');
 // const attributesRoutes = require('./routes/attributes.routes');
 const dashboardRoutes = require('./routes/Dashboard.routes');
  const app = express();
  const port = process.env.PORT || 3001;

  // ===== CORS CONFIGURAÇÃO MELHORADA =====
  app.use(cors({
    origin: function (origin, callback) {
      // Lista de origens permitidas
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500', // Live Server
        'http://127.0.0.1:5500',
        'http://localhost:5501',
        'http://127.0.0.1:5501',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
      ];
      
      // Permite requests sem origin (file://, Postman, etc)
      if (!origin) return callback(null, true);
      
      // Durante desenvolvimento, permite origens 127.0.0.1 com qualquer porta
      if (origin.startsWith('http://127.0.0.1:') || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('⚠️ Origem bloqueada pelo CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
    optionsSuccessStatus: 200
  }));

  // ===== MIDDLEWARE =====
  app.use(express.json());
  app.use('/images', express.static(path.join(__dirname, '../Frontend/images')));
  app.use('/models', express.static(path.join(__dirname, '../Frontend/models')));
  app.use('/forgot-password', forgotRoutes);
  app.use('/reset-password', resetRoutes);
  // ===== ROTAS =====
  app.use('/categories', categoriesRoutes);
 // app.use('/subcategories', subcategoriesRoutes);
  app.use('/auth', authRoutes);
  app.use('/admin', adminRoutes);
  app.use('/products', productRoutes);
  app.use('/users', userRoutes);
  app.use('/orders', orderRoutes);
  app.use('/contact', contactRoutes);
 // app.use('/attributes', attributesRoutes);
  // ===== ROTA TESTE =====
  app.get('/', (_, res) => {
    res.send('Backend a funcionar 🚀');
  });

  app.use('/api/dashboard', dashboardRoutes);

  // ===== TRATAMENTO DE ERROS =====
  app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  });

  // ===== INICIAR SERVIDOR =====
  app.listen(port, () => {
    console.log(`✅ Servidor a correr em http://localhost:${port}`);
    console.log(`✅ CORS configurado para múltiplas origens`);
    console.log(`✅ CORS configurado para múltiplas origens`);
    console.log(`✅ CORS configurado para múltiplas origens`);
  });