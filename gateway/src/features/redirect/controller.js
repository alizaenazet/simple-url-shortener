import { redirectService } from './service.js';
import { errorResponse } from '../../utils/response.js';

class RedirectController {
    async redirect(req, res) {
        try {
            const { shortCode } = req.params;
            const result = await redirectService.getRedirectUrl(shortCode);
            
            // If the shortener service returns the long URL, redirect to it
            if (result && result.longUrl) {
                return res.redirect(302, result.longUrl);
            }

            // If response is HTML (redirect page), send it
            res.send(result);

        } catch (error) {
            if (error.response?.status === 404 || error.message.includes('Circuit breaker is OPEN')) {
                // Return a simple 404 page or JSON based on Accept header
                const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
                
                if (acceptsJson) {
                    return res.status(404).json(errorResponse(
                        'Short URL not found or service temporarily unavailable.',
                        [{ code: 'SHORT_URL_UNAVAILABLE', message: 'The requested short URL does not exist or is no longer active.' }]
                    ));
                }

                return res.status(404).send(`
                    <!DOCTYPE html>
                    <html>
                    <head><title>URL Not Found</title></head>
                    <body>
                        <h1>404 - URL Not Found</h1>
                        <p>The short URL you're looking for doesn't exist or the service is temporarily unavailable.</p>
                        <p>Please try again later.</p>
                    </body>
                    </html>
                `);
            }

            const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
            
            if (acceptsJson) {
                return res.status(500).json(errorResponse(
                    'An internal server error occurred during redirection.',
                    [{ code: 'REDIRECT_FAILED', message: 'Failed to process the URL redirection.' }]
                ));
            }

            res.status(500).send(`
                <!DOCTYPE html>
                <html>
                <head><title>Server Error</title></head>
                <body>
                    <h1>500 - Server Error</h1>
                    <p>An error occurred while processing your request.</p>
                    <p>Please try again later.</p>
                </body>
                </html>
            `);
        }
    }
}

export const redirectController = new RedirectController();
