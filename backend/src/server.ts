import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { sequelize } from './models';
import authRoutes from './routes/authRoutes';
import likeRoutes from './routes/likeRoutes';
import pointRoutes from './routes/pointRoutes';
import adminRoutes from './routes/adminRoutes';
import raffleRoutes from './routes/raffleRoutes';
import { CleanupService } from './services/cleanupService';

dotenv.config();

// ✨ ここから置き換え（app/PORT定義の直後あたりに）
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigin =
  process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN || '').trim()   // 例: https://clinic-evaluation-app.vercel.app
    : 'http://localhost:3000';

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    // ブラウザ以外(curl/サーバ間)はoriginが無いことがある → 許可
    if (!origin) return cb(null, true);
    if (origin === allowedOrigin) return cb(null, true);
    // 将来複数許可にしたい場合は allowedOrigin を配列にして includes() にする
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// セキュリティ系 → CORS → プリフライト許可 の順
app.use(helmet());
app.use(cors(corsOptions));
// --- ここまで CORS ---

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/points', pointRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/raffle', raffleRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync database models (create tables if they don't exist, but don't alter existing ones)
    await sequelize.sync();
    console.log('Database models synchronized.');

    // Start cleanup service
    const cleanupService = CleanupService.getInstance();
    cleanupService.startScheduledCleanup();
    console.log('Cleanup service started.');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;