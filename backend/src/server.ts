import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import catalogRoutes from './routes/catalog.js';
import marketplaceRoutes from './routes/marketplace.js';
import negotiationRoutes from './routes/negotiations.js';
import reviewRoutes from './routes/reviews.js';
import bountyRoutes from './routes/bounties.js';
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chats.js';
import feedRoutes from './routes/feed.js';
import aiRoutes from './routes/ai.js';

const app = express();

// --------------- Middleware ---------------
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------- Health Check ---------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------- Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bounties', bountyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/ai', aiRoutes);

// --------------- Error Handler ---------------
app.use(errorHandler);

// --------------- Start Server ---------------
app.listen(config.port, () => {
  console.log(`[server] running on http://localhost:${config.port}`);
  console.log(`[server] environment: ${config.nodeEnv}`);
});

export default app;
