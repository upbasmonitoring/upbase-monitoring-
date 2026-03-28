import express from 'express';
import dotenv from 'dotenv';
import Joi from 'joi';
import { crypto } from 'node:crypto';
import { runQueryFlow } from './services/aiFlow.js';

dotenv.config();

const app = express();
app.use(express.json());

// API Key Validation Middleware
const requireApiKey = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.MCP_API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
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

// Route: POST /mcp/query
app.post('/mcp/query', requireApiKey, async (req, res) => {
    // Merge query and body for debug flag if present in URL
    const debugMode = req.query.debug === 'true' || req.body.debug === true;
    
    // Input validation
    const { error, value } = querySchema.validate({ ...req.body, debug: debugMode });
    if (error) {
        return res.status(400).json({ error: `Validation Error: ${error.details[0].message}` });
    }

    // Generate unique Request ID
    const requestId = crypto ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
        const result = await runQueryFlow({ ...value, requestId });
        res.json(result);
    } catch (err) {
        console.error(`[MCP][${requestId}][SYSTEM] Critical Error:`, err);
        res.status(500).json({ 
            requestId,
            error: 'Internal system error processing MCP request',
            timestamp: new Date().toISOString()
        });
    }
});

const PORT = process.env.MCP_PORT || 4000;
app.listen(PORT, () => {
    console.log(`[POLISHED] MCP Observability Server running on port ${PORT}`);
});
