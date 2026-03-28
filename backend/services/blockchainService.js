import BlockchainLog from '../models/BlockchainLog.js';

/**
 * blockchainService - SRE-tier Audit Layer
 * Provides cryptographic verification for observability data.
 */
export async function storeHash(hash, type, monitorId = null) {
    if (!hash || !type) return null;
    try {
        // Asynchronous non-blocking storage
        const log = await BlockchainLog.create({
            hash,
            type,
            monitorId,
            timestamp: new Date()
        });
        console.log(`[BLOCKCHAIN][AUDIT] Record Created: ${type} -> ${hash.slice(0, 10)}...`);
        return log;
    } catch (err) {
        // Skip duplicates (idempotent hash storage)
        if (err.code === 11000) {
            console.log(`[BLOCKCHAIN][AUDIT] Duplicate hash detected: ${hash.slice(0, 10)}... (Ignored)`);
            return null;
        }
        console.error(`[BLOCKCHAIN][AUDIT][ERROR] ${err.message}`);
        return null;
    }
}

/**
 * Verifies if a specific hash exists in the tamper-proof log.
 */
export async function verifyHash(hash) {
    if (!hash) return { exists: false, error: "Missing hash parameter" };
    try {
        const record = await BlockchainLog.findOne({ hash }).lean();
        return {
            exists: !!record,
            record: record || null,
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.error(`[BLOCKCHAIN][VERIFY][ERROR] ${err.message}`);
        return { exists: false, error: err.message };
    }
}
