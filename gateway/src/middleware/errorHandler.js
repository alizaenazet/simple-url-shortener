import { errorResponse } from '../utils/response.js';

export const handleServiceError = (error, defaultMessage) => {
    console.error('Service error:', error.message);
    console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
            method: error.config?.method,
            url: error.config?.url,
            baseURL: error.config?.baseURL
        }
    });
    
    // Circuit breaker is open
    if (error.message.includes('Circuit breaker is OPEN')) {
        return {
            status: 503,
            data: errorResponse(
                'Service temporarily unavailable. Please try again later.',
                [{ code: 'SERVICE_UNAVAILABLE', message: error.message }]
            )
        };
    }
    
    // Network/connection errors (service completely offline)
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
        return {
            status: 503,
            data: errorResponse(
                'Service temporarily unavailable. Please try again later.',
                [{ code: 'SERVICE_OFFLINE', message: 'The required service is currently offline or unreachable.' }]
            )
        };
    }
    
    if (error.response) {
        const { status, data } = error.response;
        return {
            status: status,
            data: data || errorResponse(defaultMessage, [{ message: defaultMessage }])
        };
    }
    
    return {
        status: 503,
        data: errorResponse(
            'Service temporarily unavailable. Please try again later.',
            [{ code: 'SERVICE_UNAVAILABLE', message: defaultMessage }]
        )
    };
};

export const errorHandler = (err, req, res, next) => {
    console.error('Gateway error:', err.stack);
    res.status(500).json(errorResponse(
        'An internal server error occurred. Please try again later.',
        [{ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong!' }]
    ));
};

export const notFoundHandler = (req, res) => {
    res.status(404).json(errorResponse(
        'Endpoint not found.',
        [{ code: 'ENDPOINT_NOT_FOUND', message: 'The requested endpoint does not exist.' }]
    ));
};
