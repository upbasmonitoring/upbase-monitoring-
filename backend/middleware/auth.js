import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiKey from '../models/ApiKey.js';
import { validateApiKey, hashApiKey } from '../utils/apiKeyService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const apiKeyHeader = req.headers['x-api-key'] || (req.headers.authorization?.startsWith('Bearer monitr_') || req.headers.authorization?.startsWith('Bearer sk_live_') ? req.headers.authorization.split(' ')[1] : null);

  // 1. Check for JWT (Secure Cookie prioritised, then Auth Header)
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer') &&
    !req.headers.authorization.startsWith('Bearer monitr_') &&
    !req.headers.authorization.startsWith('Bearer sk_live_')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  // 2. Check for API Key (Developers/SDKs like monitr_ or sk_live_)
  if (apiKeyHeader) {
    try {
      const isKeyValid = await validateApiKey(apiKeyHeader); 
      if (isKeyValid) {
        // validateApiKey handles hashing and database verification
        const hashedKey = hashApiKey(apiKeyHeader);
        const apiKeyDoc = await ApiKey.findOne({ keyHash: hashedKey });
        
        req.user = await User.findById(apiKeyDoc.user);
        req.project = apiKeyDoc.project; // Attach project scope
        req.isApiKey = true;
        return next();
      }
      res.status(401);
      throw new Error('Invalid Secret Key Handshake');
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, API key failed');
    }
  }

  res.status(401);
  throw new Error('Not authorized, no token or API key provided');
});

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role ${req.user.role} is not authorized to access this route`);
    }
    next();
  };
};

/**
 * Admin middleware (Legacy/Shortcut)
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

