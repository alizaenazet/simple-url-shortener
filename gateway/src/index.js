import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { setupMiddleware, errorHandler, notFoundHandler } from './middleware/index.js';
import { authRoutes } from './features/auth/routes.js';
import { urlRoutes } from './features/urls/routes.js';
import { redirectRoutes } from './features/redirect/routes.js';
import { healthRoutes } from './features/health/routes.js';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Setup custom middleware
setupMiddleware(app);

// Routes - Order matters!
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/urls', urlRoutes);

// Redirect routes should be last to catch short codes
app.use('/', redirectRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`Gateway listening on :${config.port}`);
});
