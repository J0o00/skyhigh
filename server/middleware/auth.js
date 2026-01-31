/**
 * Authentication Middleware
 * 
 * Provides authentication and authorization middleware for protecting routes.
 * 
 * For MVP, this uses a simple header-based authentication.
 * In production, this should be replaced with JWT or session-based auth.
 */

const User = require('../models/User');

/**
 * Require authentication
 * Checks for user ID in request header or body
 */
const requireAuth = async (req, res, next) => {
    try {
        // Get user ID from header, body, or query
        const userId = req.headers['x-user-id'] || req.body.userId || req.query.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required. Please provide user ID.'
            });
        }

        // Validate user exists and is active
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid user ID. User not found.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated.'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error.'
        });
    }
};

/**
 * Require specific role(s)
 * @param {string|string[]} roles - Required role(s)
 */
const requireRole = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
};

/**
 * Require admin role
 */
const requireAdmin = [requireAuth, requireRole('admin')];

/**
 * Require agent or admin role
 */
const requireAgentOrAdmin = [requireAuth, requireRole(['agent', 'admin'])];

/**
 * Optional authentication
 * Attaches user to request if authenticated, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.userId || req.query.userId;

        if (userId) {
            const user = await User.findById(userId).select('-password');
            if (user && user.isActive) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication on error
        next();
    }
};

module.exports = {
    requireAuth,
    requireRole,
    requireAdmin,
    requireAgentOrAdmin,
    optionalAuth
};
