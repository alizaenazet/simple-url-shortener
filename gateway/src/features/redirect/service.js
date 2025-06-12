import { httpClient } from '../../services/httpClient.js';

class RedirectService {
    async getRedirectUrl(shortCode) {
        try {
            const response = await httpClient.get('shortener', `service/redirect/${shortCode}`);
            return response.data;
        } catch (error) {
            if (error.message.includes('Circuit breaker is OPEN')) {
                // When shortener service is down, we can't redirect
                throw new Error('Redirect service is temporarily unavailable.');
            }
            throw error;
        }
    }
}

export const redirectService = new RedirectService();
