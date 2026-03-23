import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import { connectDB } from './server/config/db';
import authRoutes from './server/routes/auth.routes';
import studentRoutes from './server/routes/student.routes';
import hostelRoutes from './server/routes/hostel.routes';
import accommodationRoutes from './server/routes/accommodation.routes';
import feeRoutes from './server/routes/fee.routes';
import complaintRoutes from './server/routes/complaint.routes';
import leaveRoutes from './server/routes/leave.routes';
import analyticsRoutes from './server/routes/analytics.routes';
import userRoutes from './server/routes/user.routes';
import systemRoutes from './server/routes/system.routes';
import seedRoutes from './server/routes/seed.routes';
import hodRoutes from './server/routes/hod.routes';
import alertRoutes from './server/routes/alert.routes';
import noticeRoutes from './server/routes/notice.routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to Database
  await connectDB();

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/students', studentRoutes);
  app.use('/api/v1/hostels', hostelRoutes);
  app.use('/api/v1/accommodation', accommodationRoutes);
  app.use('/api/v1/fees', feeRoutes);
  app.use('/api/v1/complaints', complaintRoutes);
  app.use('/api/v1/leaves', leaveRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/system', systemRoutes);
  app.use('/api/v1/seed', seedRoutes);
  app.use('/api/v1/hod', hodRoutes);
  app.use('/api/v1/alerts', alertRoutes);
  app.use('/api/v1/notices', noticeRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
