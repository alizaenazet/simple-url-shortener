import { qrService } from './service.js';
import { validateQRRequest } from './validation.js';

export const qrController = {
    async generateQR(req, res) {
        try {
            // Validate request body
            const validation = validateQRRequest(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed.',
                    data: null,
                    errors: validation.errors
                });
            }

            // Forward request to QR service
            const result = await qrService.generateQR(req.body.data);
            
            res.status(200).json(result);
        } catch (error) {
            console.error('QR generation error:', error);
            
            // Handle service errors
            if (error.response) {
                return res.status(error.response.status).json(error.response.data);
            }
            
            // Handle unexpected errors
            res.status(500).json({
                status: 'error',
                message: 'Failed to generate QR code.',
                data: null,
                errors: [
                    {
                        code: 'QR_GENERATION_FAILED',
                        message: 'An error occurred while generating the QR code.'
                    }
                ]
            });
        }
    }
};
