import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { errorResponse } from '../utils/response.js';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json(errorResponse(
            'Unauthorized. Please login again.',
            [{ code: 'TOKEN_MISSING', message: 'Authentication token is missing, invalid, or expired.' }]
        ));
    }

    jwt.verify(token, config.jwtSecret, (err, user) => {
        if (err) {
            return res.status(401).json(errorResponse(
                'Unauthorized. Please login again.',
                [{ code: 'TOKEN_INVALID', message: 'Authentication token is missing, invalid, or expired.' }]
            ));
        }
        req.user = user;
        next();
    });
};
