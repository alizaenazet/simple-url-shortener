import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { setupMiddleware } from './middleware/index.js';
import { authRoutes } from './features/auth/routes.js';
import { urlRoutes } from './features/urls/routes.js';
import { redirectRoutes } from './features/redirect/routes.js';
import { healthRoutes } from './features/health/routes.js';
import { qrRoutes } from './features/qr/routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Setup custom middleware
setupMiddleware(app);

// Routes
app.use('/', redirectRoutes);
app.use('/', healthRoutes);
app.use('/auth', authRoutes);
app.use('/urls', urlRoutes);
app.use('/qr', qrRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`Gateway listening on :${config.port}`);
});
