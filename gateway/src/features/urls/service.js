import { httpClient } from '../../services/httpClient.js';

class UrlService {
    async create(userId, urlData, req) {
        try {
            const authHeaders = httpClient.getAuthHeaders(req);
            const response = await httpClient.post('user', `service/users/${userId}/urls`, urlData, {
                headers: authHeaders
            });
            return response.data;
        } catch (error) {
            if (error.message.includes('Circuit breaker is OPEN')) {
                throw new Error('URL shortening service is temporarily unavailable. Please try again later.');
            }
            throw error;
        }
    }

    async getAll(userId, queryParams, req) {
        try {
            const authHeaders = httpClient.getAuthHeaders(req);
            const response = await httpClient.get('user', `service/users/${userId}/urls`, { 
                params: queryParams,
                headers: authHeaders
            });
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

    async getOne(userId, shortCode, req) {
        try {
            const authHeaders = httpClient.getAuthHeaders(req);
            const response = await httpClient.get('user', `service/users/${userId}/urls/${shortCode}`, {
                headers: authHeaders
            });
            return response.data;
        } catch (error) {
            if (error.message.includes('Circuit breaker is OPEN')) {
                throw new Error('URL retrieval service is temporarily unavailable. Please try again later.');
            }
            throw error;
        }
    }

    async delete(userId, shortCode, req) {
        try {
            const authHeaders = httpClient.getAuthHeaders(req);
            await httpClient.delete('user', `service/users/${userId}/urls/${shortCode}`, {
                headers: authHeaders
            });
        } catch (error) {
            if (error.message.includes('Circuit breaker is OPEN')) {
                throw new Error('URL deletion service is temporarily unavailable. Please try again later.');
            }
            throw error;
        }
    }
}

export const urlService = new UrlService();
