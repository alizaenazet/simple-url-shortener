import { httpClient } from '../../services/httpClient.js';

class AuthService {
    async register(userData) {
        try {
            const response = await httpClient.post('user', 'service/users/register', userData);
            return response.data;
        } catch (error) {
            // If user service is down, provide meaningful error
            if (error.message.includes('Circuit breaker is OPEN')) {
                throw new Error('User registration service is temporarily unavailable. Please try again later.');
            }
            throw error;
        }
    }

    async login(credentials) {
        try {
            const response = await httpClient.post('user', 'service/users/login', credentials);
            return response.data;
        } catch (error) {
            // If user service is down, provide meaningful error
            if (error.message.includes('Circuit breaker is OPEN')) {
                throw new Error('Authentication service is temporarily unavailable. Please try again later.');
            }
            throw error;
        }
    }
}

export const authService = new AuthService();
