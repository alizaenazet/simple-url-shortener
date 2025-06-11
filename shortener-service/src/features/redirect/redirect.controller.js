import { RedirectService } from './redirect.service.js';
import { dbHealth } from '../../config/database.js';

const redirectService = new RedirectService();

export class RedirectController {
  
  // Internal API endpoint for gateway
  async getRedirectData(req, res) {
    try {
      const { shortCode } = req.params;
      
      if (!shortCode) {
        return res.status(400).json({
          status: 'error',
          message: 'Short code is required.',
          data: null,
          errors: [{
            field: 'shortCode',
            message: 'Short code parameter is missing.'
          }]
        });
      }

      const result = await redirectService.getLongUrl(shortCode);
      
      if (!result.success) {
        return res.status(404).json({
          status: 'error',
          message: 'Short URL not found or has expired.',
          data: null,
          errors: [result.error]
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Long URL retrieved successfully.',
        data: result.data,
        errors: null
      });

    } catch (error) {
      console.error('Error in getRedirectData:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An internal server error occurred during redirection.',
        data: null,
        errors: [{
          code: 'REDIRECT_FAILED',
          message: 'Failed to process the URL redirection.'
        }]
      });
    }
  }

  // Direct redirect endpoint (for browser access)
  async redirectToLongUrl(req, res) {
    try {
      const { shortCode } = req.params;
      
      const result = await redirectService.getRedirectPageData(shortCode);
      
      if (!result.success) {
        const bothDbsDown = !dbHealth.redis.connected && !dbHealth.postgres.connected;
        
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>URL Not Found</title>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f8f9fa; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error { color: #e74c3c; }
              .warning { color: #f39c12; margin-top: 20px; font-size: 14px; }
              .status { background: #ecf0f1; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 12px; }
              .status-item { margin: 5px 0; }
              .connected { color: #27ae60; }
              .disconnected { color: #e74c3c; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">${bothDbsDown ? 'Service Temporarily Unavailable' : 'URL Not Found'}</h1>
              <p>${bothDbsDown ? 
                'Our URL shortener service is temporarily experiencing database connectivity issues. Please try again later.' : 
                'The short URL you\'re looking for doesn\'t exist or has expired.'
              }</p>
              
              ${bothDbsDown ? `
                <div class="warning">
                  <strong>Service Status:</strong>
                  <div class="status">
                    <div class="status-item">
                      Redis: <span class="${dbHealth.redis.connected ? 'connected' : 'disconnected'}">
                        ${dbHealth.redis.connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div class="status-item">
                      PostgreSQL: <span class="${dbHealth.postgres.connected ? 'connected' : 'disconnected'}">
                        ${dbHealth.postgres.connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          </body>
          </html>
        `);
      }

      const { longUrl, redirectDelay, source, dbStatus } = result.data;
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting...</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background-color: #f8f9fa;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .countdown {
              font-size: 24px;
              color: #3498db;
              margin: 20px 0;
            }
            .url {
              color: #666;
              word-break: break-all;
              margin: 20px 0;
            }
            .source-info {
              font-size: 12px;
              color: #7f8c8d;
              margin-top: 20px;
              padding: 10px;
              background: #ecf0f1;
              border-radius: 5px;
            }
            .status-indicator {
              display: inline-block;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              margin-right: 5px;
            }
            .connected { background-color: #27ae60; }
            .disconnected { background-color: #e74c3c; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Redirecting...</h1>
            <div class="spinner"></div>
            <div class="countdown" id="countdown">3</div>
            <p>You will be redirected to:</p>
            <div class="url">${longUrl}</div>
            
            <div class="source-info">
              <div>Retrieved from: <strong>${source === 'redis' ? 'Redis Cache' : 'PostgreSQL Database'}</strong></div>
              <div style="margin-top: 8px;">
                <span class="status-indicator ${dbStatus.redis === 'connected' ? 'connected' : 'disconnected'}"></span>
                Redis: ${dbStatus.redis}
                <span style="margin-left: 15px;" class="status-indicator ${dbStatus.postgres === 'connected' ? 'connected' : 'disconnected'}"></span>
                PostgreSQL: ${dbStatus.postgres}
              </div>
            </div>
          </div>

          <script>
            let countdown = 3;
            const countdownEl = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              countdown--;
              countdownEl.textContent = countdown;
              
              if (countdown <= 0) {
                clearInterval(timer);
                window.location.href = "${longUrl}";
              }
            }, 1000);

            setTimeout(() => {
              window.location.href = "${longUrl}";
            }, ${redirectDelay});
          </script>
        </body>
        </html>
      `);

    } catch (error) {
      console.error('Error in redirectToLongUrl:', error);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Service Error</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f8f9fa; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #e74c3c; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Service Temporarily Unavailable</h1>
            <p>We're experiencing technical difficulties. Please try again in a few moments.</p>
          </div>
        </body>
        </html>
      `);
    }
  }
}
