/**
 * API Response Middleware
 * 
 * Standardizes all API responses with consistent format:
 * - Success: { success: true, data: {...}, meta: {...} }
 * - Error: { success: false, error: { code: "", message: "" } }
 */

/**
 * Wrap successful response
 */
function success(res, data, statusCode = 200, meta = {}) {
    return res.status(statusCode).json({
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
            ...meta
        }
    });
}

/**
 * Wrap error response
 */
function error(res, message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) {
    const response = {
        success: false,
        error: {
            code,
            message
        }
    };

    if (details) {
        response.error.details = details;
    }

    return res.status(statusCode).json(response);
}

/**
 * Common error codes
 */
const ErrorCodes = {
    // 400 Bad Request
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    MISSING_FIELD: 'MISSING_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',

    // 401 Unauthorized
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_TOKEN: 'INVALID_TOKEN',

    // 404 Not Found
    NOT_FOUND: 'NOT_FOUND',
    CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
    AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
    INTERACTION_NOT_FOUND: 'INTERACTION_NOT_FOUND',

    // 409 Conflict
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

    // 500 Internal
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

/**
 * Express middleware to attach response helpers to res object
 */
function apiResponseMiddleware(req, res, next) {
    // Attach helpers to response object
    res.apiSuccess = (data, meta) => success(res, data, 200, meta);
    res.apiCreated = (data, meta) => success(res, data, 201, meta);
    res.apiError = (message, code, statusCode, details) => error(res, message, code, statusCode, details);

    // Shorthand error methods
    res.apiBadRequest = (message, details) => error(res, message, ErrorCodes.VALIDATION_ERROR, 400, details);
    res.apiNotFound = (message) => error(res, message || 'Resource not found', ErrorCodes.NOT_FOUND, 404);
    res.apiUnauthorized = (message) => error(res, message || 'Unauthorized', ErrorCodes.UNAUTHORIZED, 401);
    res.apiServerError = (message, details) => error(res, message || 'Internal server error', ErrorCodes.INTERNAL_ERROR, 500, details);

    next();
}

module.exports = {
    apiResponseMiddleware,
    success,
    error,
    ErrorCodes
};
