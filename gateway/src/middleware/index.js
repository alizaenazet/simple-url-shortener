import { requestLogger } from './requestLogger.js';

export const setupMiddleware = (app) => {
    app.use(requestLogger);
};
