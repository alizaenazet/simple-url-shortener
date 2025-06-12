import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { initializeDatabases, closeDatabases } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const port = process.env.PORT || 3001;
const serviceName = process.env.SVC_NAME || 'user-service';

app.use(express.json());

// Routes
app.use('/service/users', userRoutes); // User URL management routes
// app.use('/auth', authRoutes);  // Changed from '/service/auth' to '/auth'
// Also keeping the original endpoint available for backward compatibility
app.use('/service/auth', authRoutes);  

// Health check endpoint
app.get('/service/health', (_req, res) => {
  res.json({ service: serviceName, status: 'online' });
});

// Root status check
app.get('/', (_req, res) => {
  res.json({ service: serviceName, status: 'online' });
});

// Start server after DB init
initializeDatabases()
  .then(() => {
    app.listen(port, () => {
      console.log(`${serviceName} is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await closeDatabases();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  await closeDatabases();
  process.exit(0);
});