const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token, authorization denied' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Token is not valid' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Token is not valid' 
        });
    }
};

const apiKeyAuth = (req, res, next) => {
    const apiKey = req.body.api_key || req.query.api_key;
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ 
            success: false,
            message: 'Invalid API key' 
        });
    }
    
    next();
};

module.exports = { auth, apiKeyAuth };