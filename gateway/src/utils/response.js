export const formatResponse = (status, message, data = null, errors = null) => ({
    status,
    message,
    data,
    errors
});

export const successResponse = (message, data = null) => 
    formatResponse('success', message, data, null);

export const errorResponse = (message, errors = null, data = null) => 
    formatResponse('error', message, data, errors);
