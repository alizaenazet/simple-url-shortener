import { requestLogger } from './requestLogger.js';
import { errorHandler, notFoundHandler } from './errorHandler.js';

export const setupMiddleware = (app) => {
    app.use(requestLogger);
};

export { errorHandler, notFoundHandler };
