const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL', 'EMAIL_USER', 'EMAIL_PASS'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length) {
  console.error(`❌ Variáveis de ambiente em falta: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const authRoutes       = require('./auth');
const adminRoutes      = require('./admin');
const productRoutes    = require('./routes/products.routes');
const userRoutes       = require('./routes/users.routes');
const categoriesRoutes = require('./routes/categories.routes');
const orderRoutes      = require('./routes/orders.routes');
const contactRoutes    = require('./routes/contact.routes');
const forgotRoutes     = require('./routes/forgot.routes');
const resetRoutes      = require('./routes/reset.routes');
const dashboardRoutes  = require('./routes/Dashboard.routes');
const { globalLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(globalLimiter);
app.use(morgan('[:date[iso]] :method :url :status :res[content-length] - :response-time ms'));

const allowedOrigins = [
  'http://localhost:3000', 'http://127.0.0.1:3000',
  'http://localhost:5500', 'http://127.0.0.1:5500',
  'http://localhost:5501', 'http://127.0.0.1:5501',
  'http://localhost:8080', 'http://127.0.0.1:8080'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    console.warn('⚠️ CORS bloqueado:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// ===== AUMENTAR LIMITE DE TAMANHO PARA UPLOADS =====
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use('/images', express.static(path.join(__dirname, 'Frontend/images')));
app.use('/models', express.static(path.join(__dirname, 'Frontend/models')));
app.use('/forgot-password', forgotRoutes);
app.use('/reset-password', resetRoutes);

// ===== ROTAS =====
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Categorias — router dedicado
// /api/categories/primary      → getPrimaryCategories
// /api/categories/secondary    → getSecondaryCategories
// /api/categories              → getSecondaryCategories (legado)
app.use('/api/categories', categoriesRoutes);
app.use('/categories', categoriesRoutes);     // legado

// Produtos
app.use('/products',     productRoutes);
app.use('/api/products', productRoutes);

app.use('/users',   userRoutes);
app.use('/orders',  orderRoutes);
app.use('/contact', contactRoutes);

app.get('/', (_, res) => res.send('Backend a funcionar 🚀'));
app.use('/api/dashboard', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error('Erro:', err.message || err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(port, () => {
  console.log(`✅ Servidor a correr em http://localhost:${port}`);
  console.log(`🔒 Helmet | CORS (${allowedOrigins.length} origens) | Rate limit ativos`);
  console.log(`📤 Limite de upload: 100MB (Nginx: 100MB | Express: 100MB)`);
});