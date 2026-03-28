import express from 'express';
import { verifyHash } from '../services/blockchainService.js';

const router = express.Router();

/**
 * Route: GET /api/blockchain/verify/:hash
 * Verifies the integrity of a log or event via the blockchain audit layer.
 */
router.get('/verify/:hash', async (req, res) => {
    const { hash } = req.params;
    
    try {
        const result = await verifyHash(hash);
        
        if (!result.exists) {
            return res.status(404).json({
                verified: false,
                message: "Hash not found in the blockchain audit trail. Integrity cannot be verified.",
                hash
            });
        }

        res.json({
            verified: true,
            message: "Hash verified against tamper-proof audit log.",
            ...result
        });
    } catch (err) {
        console.error(`[BLOCKCHAIN][API][ERROR] ${err.message}`);
        res.status(500).json({ error: "Internal server error during verification pulse" });
    }
});

export default router;
