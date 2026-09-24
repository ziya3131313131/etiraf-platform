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
import { setupSocketHandlers } from './socket/handlers.js';
import { createAdmin } from './utils/createAdmin.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
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

// Socket.IO handlers
setupSocketHandlers(io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server işləyir' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server http://localhost:${PORT} ünvanında işləyir`);
  console.log(`👤 Admin: reyllas / reylasbaba2019z`);
});

export { io };
