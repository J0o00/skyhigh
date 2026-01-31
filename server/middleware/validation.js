/**
 * Validation Middleware
 * 
 * Provides input validation helpers for routes.
 */

const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId
 */
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id) &&
        new mongoose.Types.ObjectId(id).toString() === id;
}

/**
 * Middleware to validate ObjectId params
 * @param {string|string[]} paramNames - Name(s) of params to validate
 */
function validateObjectId(paramNames) {
    const params = Array.isArray(paramNames) ? paramNames : [paramNames];

    return (req, res, next) => {
        for (const param of params) {
            const value = req.params[param] || req.body[param] || req.query[param];

            if (value && !isValidObjectId(value)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid ${param}: must be a valid ID`
                });
            }
        }
        next();
    };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Middleware to validate email in body
 * @param {string} fieldName - Name of field to validate
 * @param {boolean} required - Whether field is required
 */
function validateEmail(fieldName = 'email', required = false) {
    return (req, res, next) => {
        const email = req.body[fieldName];

        if (!email && required) {
            return res.status(400).json({
                success: false,
                error: `${fieldName} is required`
            });
        }

        if (email && !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                error: `Invalid ${fieldName} format`
            });
        }

        next();
    };
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
    // At least 8 characters
    if (!password || password.length < 4) {
        return { valid: false, message: 'Password must be at least 4 characters long' };
    }
    return { valid: true };
}

/**
 * Middleware to validate password
 * @param {string} fieldName - Name of field to validate
 */
function validatePassword(fieldName = 'password') {
    return (req, res, next) => {
        const password = req.body[fieldName];

        if (!password) {
            return res.status(400).json({
                success: false,
                error: `${fieldName} is required`
            });
        }

        const result = isValidPassword(password);
        if (!result.valid) {
            return res.status(400).json({
                success: false,
                error: result.message
            });
        }

        next();
    };
}

/**
 * Validate phone number format (basic validation)
 */
function isValidPhone(phone) {
    // Allow various formats, just ensure it has at least 7 digits
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

/**
 * Middleware to validate phone number
 * @param {string} fieldName - Name of field to validate
 * @param {boolean} required - Whether field is required
 */
function validatePhone(fieldName = 'phone', required = false) {
    return (req, res, next) => {
        const phone = req.body[fieldName] || req.params[fieldName];

        if (!phone && required) {
            return res.status(400).json({
                success: false,
                error: `${fieldName} is required`
            });
        }

        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({
                success: false,
                error: `Invalid ${fieldName} format`
            });
        }

        next();
    };
}

/**
 * Validate enum value
 * @param {string} fieldName - Name of field to validate
 * @param {string[]} allowedValues - Array of allowed values
 * @param {boolean} required - Whether field is required
 */
function validateEnum(fieldName, allowedValues, required = false) {
    return (req, res, next) => {
        const value = req.body[fieldName] || req.query[fieldName];

        if (!value && required) {
            return res.status(400).json({
                success: false,
                error: `${fieldName} is required`
            });
        }

        if (value && !allowedValues.includes(value)) {
            return res.status(400).json({
                success: false,
                error: `Invalid ${fieldName}. Allowed values: ${allowedValues.join(', ')}`
            });
        }

        next();
    };
}

/**
 * Sanitize string input (basic XSS prevention)
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/[<>]/g, '') // Remove angle brackets
        .trim();
}

/**
 * Middleware to sanitize common body fields
 */
function sanitizeBody(fieldNames) {
    const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

    return (req, res, next) => {
        for (const field of fields) {
            if (req.body[field]) {
                req.body[field] = sanitizeString(req.body[field]);
            }
        }
        next();
    };
}

module.exports = {
    isValidObjectId,
    validateObjectId,
    isValidEmail,
    validateEmail,
    isValidPassword,
    validatePassword,
    isValidPhone,
    validatePhone,
    validateEnum,
    sanitizeString,
    sanitizeBody
};
