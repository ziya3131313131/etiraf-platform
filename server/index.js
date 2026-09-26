import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import etirafRoutes from './routes/etiraf.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import canliYayimRoutes from './routes/canliYayim.js';
import destekRoutes from './routes/destek.js';
import yarismaRoutes from './routes/yarisma.js';
import { setupSocketHandlers } from './socket/handlers.js';
import { createAdmin } from './utils/createAdmin.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// İcazə verilən origin-lər
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://etiraf-platform.vercel.app',
  'https://etiraf-platform-git-main-ziya3131313131s-projects.vercel.app',
  'https://etiraf-platform-ziya3131313131s-projects.vercel.app'
];

// CORS konfiqurasiyası
const corsOptions = {
  origin: function (origin, callback) {
    // Origin yoxdursa (məsələn, Postman) və ya siyahıdadırsa, icazə ver
    if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Production üçün hamıya icazə ver (DEV məqsədi üçün)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(httpServer, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/etiraf')
  .then(async () => {
    console.log('✅ MongoDB bağlandı');
    // İlk admin istifadəçisini yarat
    await createAdmin();
  })
  .catch((err) => console.error('❌ MongoDB bağlantı xətası:', err));

// API Routes
app.use('/api/etiraf', etirafRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/canli-yayim', canliYayimRoutes);
app.use('/api/destek', destekRoutes);
app.use('/api/yarisma', yarismaRoutes);

// Socket.IO handlers
setupSocketHandlers(io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server işləyir',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      clientUrl: process.env.CLIENT_URL || 'not set'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Etiraf Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      etiraf: '/api/etiraf',
      admin: '/api/admin',
      canliYayim: '/api/canli-yayim',
      destek: '/api/destek',
      yarisma: '/api/yarisma'
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server http://localhost:${PORT} ünvanında işləyir`);
  console.log(`👤 Admin: reyllas / reylasbaba2019z`);
});

export { io };
