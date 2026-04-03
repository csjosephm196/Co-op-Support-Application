import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';
import documentRoutes from './routes/documents';
import coordinatorRoutes from './routes/coordinator';
import employerRoutes from './routes/employer';
import invitationRoutes from './routes/invitations';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
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
