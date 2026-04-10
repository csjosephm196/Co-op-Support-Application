import './loadEnv';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';
import documentRoutes from './routes/documents';
import coordinatorRoutes from './routes/coordinator';
import employerRoutes from './routes/employer';
import invitationRoutes from './routes/invitations';

const app = express();
app.set('trust proxy', 1);

const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const PORT = parseInt(process.env.PORT || '3000');

const isProd = process.env.NODE_ENV === 'production';

app.use(
  cors({
    // Dev: reflect request origin so localhost, 127.0.0.1, and LAN (192.168.*:5173) all work with Vite
    origin: isProd ? (process.env.FRONTEND_URL || 'http://localhost:5173') : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', limiter);
app.use('/api/auth/register', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/invitations', invitationRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_req, res) => {
  res.json({ service: 'csa-backend', health: '/api/health' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Multer error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message === 'Only PDF files are allowed') {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'File size exceeds 10MB limit' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`CSA Backend running on http://localhost:${PORT}`);
});

export default app;
