import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';

/**
 * Generates a high-entropy API key with the 'monitr_' prefix.
 * FORMAT: monitr_ + 32 random chars (hex)
 */
export const generateRawKey = () => {
    const rawValue = crypto.randomBytes(32).toString('hex');
    return `monitr_${rawValue}`;
};

/**
 * Hashes the raw key using SHA-256 for secure database storage.
 */
export const hashApiKey = (rawKey) => {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
};

/**
 * Checks a raw key against the hashed version stored in the vault.
 */
export const validateApiKey = async (rawKey) => {
    const hashed = hashApiKey(rawKey);
    const keyDoc = await ApiKey.findOne({ keyHash: hashed, isActive: true });
    
    if (keyDoc) {
        // Log last used timestamp directly on the document
        keyDoc.lastUsed = new Date();
        await keyDoc.save();
        return true;
    }
    return false;
};
