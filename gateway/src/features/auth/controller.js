import { authService } from './service.js';
import { authValidator } from './validator.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { handleServiceError } from '../../middleware/errorHandler.js';

class AuthController {
    async register(req, res) {
        try {
            const { username, password } = req.body;

            // Validation
            const validationErrors = authValidator.validateRegister({ username, password });
            if (validationErrors.length > 0) {
                return res.status(400).json(errorResponse('Validation failed.', validationErrors));
            }

            const result = await authService.register({ username, password });
            res.status(201).json(successResponse('User registered successfully.', result));

        } catch (error) {
            const errorRes = handleServiceError(error, 'Failed to process user registration.');
            
            if (error.response?.status === 409) {
                return res.status(409).json(errorResponse(
                    'Username already exists.',
                    [{ field: 'username', message: 'This username is already taken. Please choose another one.' }]
                ));
            }

            res.status(errorRes.status).json(errorRes.data);
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;

            // Validation
            const validationErrors = authValidator.validateLogin({ username, password });
            if (validationErrors.length > 0) {
                return res.status(400).json(errorResponse('Validation failed.', validationErrors));
            }

            const result = await authService.login({ username, password });
            res.status(200).json(successResponse('Login successful.', result));

        } catch (error) {
            if (error.response?.status === 401) {
                return res.status(401).json(errorResponse(
                    'Invalid username or password.',
                    [{ code: 'INVALID_CREDENTIALS', message: 'The username or password provided is incorrect.' }]
                ));
            }

            const errorRes = handleServiceError(error, 'Failed to process login request.');
            res.status(errorRes.status).json(errorRes.data);
        }
    }
}

export const authController = new AuthController();
