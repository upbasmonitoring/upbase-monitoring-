import ApiKey from '../models/ApiKey.js';

export const validateApiKey = async (req, res, next) => {
  let key = req.headers['x-api-key'] || req.query.apiKey;

  if (!key) {
    return res.status(401).json({ message: 'No API key provided' });
  }

  try {
    const apiKeyDoc = await ApiKey.findOne({ key }).populate('user');
    
    if (!apiKeyDoc) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    // Attach user and apiKey to request object
    const user = apiKeyDoc.user;
    req.user = user;
    req.apiKeyId = apiKeyDoc._id;

    // Security Feature 7: IP Protection & Blacklisting
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (user.securitySettings?.ipBlacklist?.includes(clientIp)) {
        console.log(`[SECURITY] Blocked request from blacklisted IP: ${clientIp} for user ${user.name}`);
        return res.status(403).json({ 
            message: 'Your IP is blacklisted due to suspicious activity. Please contact support.',
            threatLevel: 'severe'
        });
    }
    
    // Update last used
    apiKeyDoc.lastUsed = Date.now();
    await apiKeyDoc.save();

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
