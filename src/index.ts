import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';

import * as canvas from 'canvas';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profiles/profiles.routes';
import gymRoutes from './modules/gyms/gyms.routes';
import membershipRoutes from './modules/memberships/memberships.routes';
import workoutRoutes from './modules/workouts/workouts.routes';
import visitRoutes from './modules/visits/visits.routes';

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: env.isDev ? '*' : ['https://your-admin-panel.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, slow down.' },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'GymKlout API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/gyms', gymRoutes);
app.use('/api/v1/memberships', membershipRoutes);
app.use('/api/v1/workouts', workoutRoutes);
app.use('/api/v1/visits', visitRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

// ─── Load face-api models then start server ───────────────────────────────────
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as any);

const modelsPath = path.join(__dirname, 'models');

faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath)
  .then(() => {
    console.log('Face detection model loaded');
    app.listen(env.port, () => {
      console.log(`GymKlout API running on port ${env.port} [${env.nodeEnv}]`);
    });
  })
  .catch((err: any) => {
    console.error('Failed to load face detection model:', err);
    process.exit(1);
  });

export default app;