export function successResponse(message, data = null) {
  return {
    status: 'success',
    message,
    data,
    errors: null
  };
}

export function errorResponse(message, errors = []) {
  return {
    status: 'error',
    message,
    data: null,
    errors
  };
}
