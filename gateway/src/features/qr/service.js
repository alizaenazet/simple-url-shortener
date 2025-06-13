import axios from 'axios';
import { config } from '../../config/index.js';

export const qrService = {
    async generateQR(data) {
        try {
            const response = await axios.post(`${config.services.qr.url}qr`, {
                data
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: config.serviceTimeout || 10000
            });

            return response.data;
        } catch (error) {
            console.error('QR Service error:', error.message);
            
            if (error.response) {
                // Re-throw with service response for controller to handle
                throw error;
            }
            
            // Handle network or timeout errors
            throw new Error('QR service unavailable');
        }
    }
};
