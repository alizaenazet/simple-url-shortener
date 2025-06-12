import { httpClient } from '../../services/httpClient.js';

class UrlService {
    async create(userId, urlData) {
        try {
            const response = await httpClient.post('user', `service/users/${userId}/urls`, urlData);
            return response.data;
        } catch (error) {
            if (error.message.includes('Circuit breaker is OPEN')) {
                throw new Error('URL shortening service is temporarily unavailable. Please try again later.');
            }
            throw error;
        }
    }

    async getAll(userId, queryParams) {
        try {
            const response = await httpClient.get('user', `service/users/${userId}/urls`, { params: queryParams });
            return response.data;
        } catch (error) {
            if (error.message.includes('Circuit breaker is OPEN')) {
                // Return empty result when service is down
                return {
                    data: [],
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: 10
                    }
                };
            }
            throw error;
        }
    }

    async getOne(userId, shortCode) {
        try {
            const response = await httpClient.get('user', `service/users/${userId}/urls/${shortCode}`);
            return response.data;
        } catch (error) {
            if (error.message.includes('Circuit breaker is OPEN')) {
                throw new Error('URL retrieval service is temporarily unavailable. Please try again later.');
            }
            throw error;
        }
    }

    async delete(userId, shortCode) {
        try {
            await httpClient.delete('user', `service/users/${userId}/urls/${shortCode}`);
        } catch (error) {
            if (error.message.includes('Circuit breaker is OPEN')) {
                throw new Error('URL deletion service is temporarily unavailable. Please try again later.');
            }
            throw error;
        }
    }
}

export const urlService = new UrlService();
