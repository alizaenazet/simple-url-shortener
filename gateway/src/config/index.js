export const config = {
    port: process.env.PORT || 8080,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    services: {
        user: {
            name: 'user',
            url: process.env.USER_SVC_URL || 'http://user-service:3001/',
            timeout: 5000,
            retries: 3
        },
        shortener: {
            name: 'shortener',
            url: process.env.SHORTENER_SVC_URL || 'http://shortener-service:3002/',
            timeout: 5000,
            retries: 3
        },
        qr: {
            name: 'qr',
            url: process.env.QR_SVC_URL || 'http://qr-service:8000/',
            timeout: 5000,
            retries: 3
        }
    },
    circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000
    }
};
