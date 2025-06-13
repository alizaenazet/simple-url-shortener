export function validateQRRequest(body) {
    const errors = [];

    // Check if data field exists and is not empty
    if (!body.data) {
        errors.push({
            field: 'data',
            message: 'Data field is required and cannot be empty.'
        });
    } else if (typeof body.data !== 'string') {
        errors.push({
            field: 'data',
            message: 'Data must be a string.'
        });
    } else if (body.data.trim().length === 0) {
        errors.push({
            field: 'data',
            message: 'Data field cannot be empty or whitespace only.'
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
