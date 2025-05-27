import express from 'express';
import cors from 'cors';
import { initializeDatabases, closeDatabases } from './config/database.js';
import { routes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const port = process.env.PORT || 3002;
const NAME = process.env.SVC_NAME || 'shortener-service';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (_req, res) => res.json({ name: NAME, status: 'online' }));

// Mount routes
app.use('/', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeDatabases();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await closeDatabases();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await initializeDatabases();
    app.listen(port, () => {
      console.log(`${NAME} listening on :${port}`);
      console.log('Available endpoints:');
      console.log(`  GET /service/redirect/:shortCode - Internal API for gateway`);
      console.log(`  GET /:shortCode - Direct browser redirect`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
