import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';

// Route imports (we'll fill these in per module)
import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profiles/profiles.routes';
import gymRoutes from './modules/gyms/gyms.routes';
import membershipRoutes from './modules/memberships/memberships.routes';
import workoutRoutes from './modules/workouts/workouts.routes';

const app = express();
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.isDev ? '*' : ['https://your-admin-panel.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: 'Too many requests, slow down.' },
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'GymKlout API is running' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/gyms', gymRoutes);
app.use('/api/v1/memberships', membershipRoutes);
app.use('/api/v1/workouts', workoutRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`GymKlout API running on port ${env.port} [${env.nodeEnv}]`);
});

export default app;