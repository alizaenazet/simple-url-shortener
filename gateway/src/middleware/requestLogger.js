export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    console.log(`Incoming request: ${req.method} ${req.originalUrl || req.url}`);
    console.log(`Request path: ${req.path}`);
    console.log(`Base URL: ${req.baseUrl}`);
    console.log(`Headers:`, req.headers);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl || req.url} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
};
