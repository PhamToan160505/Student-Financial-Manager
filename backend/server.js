const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const { testDbConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { sendSuccess } = require('./utils/response');
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const transactionRoutes = require('./routes/transaction.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const budgetRoutes = require('./routes/budget.routes');
const receiptRoutes = require('./routes/receipt.routes');
const chatRoutes = require('./routes/chat.routes');
const verifyToken = require('./middleware/verifyToken');
const userModel = require('./models/user.model');
const categoryModel = require('./models/category.model');
const receiptModel = require('./models/receipt.model');
const transactionModel = require('./models/transaction.model');
const budgetModel = require('./models/budget.model');
const insightCacheModel = require('./models/insightCache.model');
const chatMessageModel = require('./models/chatMessage.model');
const authModel = require('./models/auth.model');
const savingsJarModel = require('./models/savingsJar.model');
const jarTransactionModel = require('./models/jarTransaction.model');

const savingsJarRoutes = require('./routes/savingsJar.routes');

const app = express();

// Trust proxy (Render's load balancer) for express-rate-limit
app.set('trust proxy', 1);

// 1. General Middlewares (Security & Logging)
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      process.env.CLIENT_ORIGIN
    ].filter(Boolean);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy check failed for origin: ' + origin));
    }
  },
  credentials: true
}));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 2. Health-check Route (No business logic in server.js according to MVC rules)
app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Student Financial Management API'
  }, 'API Server is running healthy');
});

// 3. Mount Routes (MVC pattern - Each resource has its own route file mounted here)
app.use('/api/auth', authRoutes);
app.use('/api/categories', verifyToken, categoryRoutes);
app.use('/api/transactions', verifyToken, transactionRoutes);
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/budgets', verifyToken, budgetRoutes);
app.use('/api/receipts', verifyToken, receiptRoutes);
app.use('/api/chat', verifyToken, chatRoutes);
app.use('/api/jars', verifyToken, savingsJarRoutes);

// 4. Handle 404 Routes
app.use('*', (req, res) => {
  return res.status(404).json({
    success: false,
    data: null,
    message: `Route not found: ${req.originalUrl}`
  });
});

// 5. Centralized Error Handler Middleware
app.use(errorHandler);

// 6. Start Server and Test DB Connection when run directly
if (require.main === module) {
  const PORT = env.PORT;
  app.listen(PORT, async () => {
    console.log(`==================================================`);
    console.log(`[Server] Running on port: http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    await testDbConnection();
    await userModel.initTable();
    await categoryModel.initTable();
    await receiptModel.initTable();
    await transactionModel.initTable();
    await budgetModel.initTable();
    await insightCacheModel.initTable();
    await chatMessageModel.initTable();
    await authModel.initTable();
    await savingsJarModel.initTable();
    await jarTransactionModel.initTable();
    console.log(`==================================================`);
  });
}

module.exports = app;
