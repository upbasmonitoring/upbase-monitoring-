import express from 'express';
import Joi from 'joi';
import crypto from 'node:crypto';
import { runQueryFlow } from '../mcp/services/aiFlow.js';

const router = express.Router();

// API Key Validation Middleware
const requireApiKey = (req, res, next) => {
    const expectedKey = process.env.MCP_API_KEY;
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    console.log("[MCP][AUTH] DEBUG:", { 
        incomingToken: token ? "PROVIDED" : "MISSING", 
        expectedKey: expectedKey ? "CONFIGURED" : "UNDEFINED",
        match: token === expectedKey 
    });

    if (!token || token !== expectedKey) {
        console.warn(`[MCP][AUTH] Unauthorized access attempt. Expected length: ${expectedKey?.length || 0}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing MCP API key' });
    }
    next();
};

// Request Validation Schema
const querySchema = Joi.object({
    query: Joi.string().required().min(3),
    monitorId: Joi.string().optional().allow(''),
    targetUrl: Joi.string().uri().optional().allow(''),
    debug: Joi.boolean().optional().default(false)
});

// Route: POST /mcp/query (Integrated into main backend)
router.post('/query', requireApiKey, async (req, res) => {
    const debugMode = req.query.debug === 'true' || req.body.debug === true;
    
    // Input validation
    const { error, value } = querySchema.validate({ ...req.body, debug: debugMode });
    if (error) {
        return res.status(400).json({ error: `Validation Error: ${error.details[0].message}` });
    }

    // Unique Request ID
    const requestId = crypto ? crypto.randomUUID() : `req_${Date.now()}`;

    try {
        const result = await runQueryFlow({ ...value, requestId });
        res.json(result);
    } catch (err) {
        console.error(`[MCP][${requestId}][ERROR] Flow failure:`, err.message);
        res.status(500).json({ 
            error: 'Internal system error processing MCP query',
            requestId 
        });
    }
});

export default router;
