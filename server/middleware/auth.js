const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Authorization denied.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

// Admin check middleware - Strictly restricted to authorized super admin
const adminMiddleware = (req, res, next) => {
    // Check for specific admin credentials (username + email)
    const isSuperAdmin = req.user && 
                         req.user.email?.toLowerCase() === 'gokul68799@gmail.com';

    if (isSuperAdmin || (req.user && req.user.role === 'admin')) {
        next();
    } else {
        console.warn(`🔒 Admin access denied for: ${req.user?.email} (Role: ${req.user?.role})`);
        res.status(403).json({
            success: false,
            message: 'Access denied. Only authorized Super Admin can access this resource.'
        });
    }
};

module.exports = { authMiddleware, adminMiddleware };
