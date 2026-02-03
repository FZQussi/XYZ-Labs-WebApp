const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const productRoutes = require('./routes/products.routes');
const userRoutes = require('./routes/users.routes');
const categoriesRoutes = require('./routes/categories.routes');
const subcategoriesRoutes = require('./routes/subcategories.routes');
const orderRoutes = require('./routes/orders.routes');
const contactRoutes = require('./routes/contact.routes');
const forgotRoutes = require('./routes/forgot.routes');
const resetRoutes = require('./routes/reset.routes');
const attributesRoutes = require('./routes/attributes.routes');

const app = express();
const port = process.env.PORT || 3001;

/* ==============================
   🔐 SEGURANÇA BASE
================================ */

// Helmet – headers de segurança
app.use(helmet());

// Rate limit GLOBAL
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Muitas requests. Tenta novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

/* ==============================
   🌍 CORS
================================ */

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:5501',
      'http://127.0.0.1:5501',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ];

    if (!origin) return callback(null, true);

    if (
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('http://localhost:')
    ) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ Origem bloqueada pelo CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

/* ==============================
   🧠 MIDDLEWARE BASE
================================ */

app.use(express.json({ limit: '10kb' })); // evita payloads gigantes

app.use('/images', express.static(path.join(__dirname, '../Frontend/images')));
app.use('/models', express.static(path.join(__dirname, '../Frontend/models')));

/* ==============================
   🔑 RATE LIMIT ESPECÍFICO AUTH
================================ */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // apenas 5 tentativas
  message: 'Demasiadas tentativas de login. Aguarda 15 minutos.'
});

app.use('/auth', authLimiter);
app.use('/forgot-password', authLimiter);
app.use('/reset-password', authLimiter);

/* ==============================
   🚦 ROTAS
================================ */

app.use('/categories', categoriesRoutes);
app.use('/subcategories', subcategoriesRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/orders', orderRoutes);
app.use('/contact', contactRoutes);
app.use('/attributes', attributesRoutes);

/* ==============================
   🧪 ROTA TESTE
================================ */

app.get('/', (_, res) => {
  res.send('Backend a funcionar 🚀');
});

/* ==============================
   ❌ TRATAMENTO DE ERROS
================================ */

app.use((err, req, res, next) => {
  console.error('Erro:', err.message);

  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});

/* ==============================
   ▶️ START SERVER
================================ */

app.listen(port, () => {
  console.log(`✅ Servidor a correr em http://localhost:${port}`);
  console.log(`🔐 Segurança ativa (Helmet + Rate Limit)`);
});
