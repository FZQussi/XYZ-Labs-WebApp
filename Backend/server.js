const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

// ===== VALIDATE REQUIRED ENV VARS =====
// Fail fast at startup — better than cryptic runtime errors
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL', 'EMAIL_USER', 'EMAIL_PASS'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length) {
  console.error(`❌ Variáveis de ambiente em falta: ${missingEnv.join(', ')}`);
  console.error('   Verifica o ficheiro .env e reinicia o servidor.');
  process.exit(1);
}

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
const { globalLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();
const port = process.env.PORT || 3001;

// ===== HELMET — Security HTTP Headers =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // allow images/models served statically
}));

// ===== GLOBAL RATE LIMITER — 200 req/min per IP =====
app.use(globalLimiter);

// ===== MORGAN — HTTP Request Logging =====
// Logs: method, url, status, response-time
app.use(morgan('[:date[iso]] :method :url :status :res[content-length] - :response-time ms'));

// ===== CORS — Strict Allowlist Only =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500', // Live Server default
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests without origin (Postman, curl, file://)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('⚠️ Origem bloqueada pelo CORS:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '10kb' }));
app.use('/images', express.static(path.join(__dirname, 'Frontend/images')));
app.use('/models', express.static(path.join(__dirname, 'Frontend/models')));
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
  console.error('Erro:', err.message || err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ===== INICIAR SERVIDOR =====
app.listen(port, () => {
  console.log(`✅ Servidor a correr em http://localhost:${port}`);
  console.log(`🔒 Helmet ativado (headers de segurança)`);
  console.log(`🔒 CORS restrito a ${allowedOrigins.length} origens permitidas`);
  console.log(`🔒 Rate limiting global ativo`);
});