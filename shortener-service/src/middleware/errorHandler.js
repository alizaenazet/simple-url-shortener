export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);

  const isApiRequest = req.path.startsWith('/service/');

  if (isApiRequest) {
    return res.status(500).json({
      status: 'error',
      message: 'An internal server error occurred.',
      data: null,
      errors: [{
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing the request.'
      }]
    });
  }

  // For browser requests, return HTML error page
  return res.status(500).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Server Error</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #e74c3c; }
      </style>
    </head>
    <body>
      <h1 class="error">Server Error</h1>
      <p>An internal server error occurred. Please try again later.</p>
    </body>
    </html>
  `);
};

export const notFoundHandler = (req, res) => {
  const isApiRequest = req.path.startsWith('/service/');

  if (isApiRequest) {
    return res.status(404).json({
      status: 'error',
      message: 'Endpoint not found.',
      data: null,
      errors: [{
        code: 'ENDPOINT_NOT_FOUND',
        message: 'The requested endpoint does not exist.'
      }]
    });
  }

  // For browser requests, return HTML 404 page
  return res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Not Found</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #e74c3c; }
      </style>
    </head>
    <body>
      <h1 class="error">Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </body>
    </html>
  `);
};
