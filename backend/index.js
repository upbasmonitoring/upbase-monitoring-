import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import mcpRoutes from './routes/mcp.js';
import webhookRoutes from './routes/webhooks.js';
import { startMonitoringEngine } from './services/monitorService.js';
import { securityShield } from './middleware/securityShield.js';
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/auth.js';
import compression from 'compression';
import blockchainRoutes from './routes/blockchain.js';
import logger from './utils/logger.js';

// Connect to MongoDB
await connectDB();

// Initialize services
startMonitoringEngine();

const app = express();

// Apply compression middleware (Gzip/Brotli)
app.use(compression());

/**
 * Middleware Setup
 */

// Enable CORS early with Production-first Handshake capability
const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:8080', 
    'http://127.0.0.1:5173', 
    'http://127.0.0.1:8080',
    'https://trimurti-tours-and-travels.pages.dev',
    'https://your-frontend.pages.dev' 
];

// --- 🛡️ EMERGENCY CORS OVERRIDE (For Smart Sync Isolation) ---
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-project-id');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle Preflight Handshake
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`[CORS] Illegal origin access attempt: ${origin}`);
            callback(new Error('Not allowed by CORS policy'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-project-id']
}));

app.use(cookieParser());

// Webhook route - Needs raw body for signature verification
app.use('/api/webhooks', webhookRoutes);

// General Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Security Layers
 */
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));
app.use(securityShield);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests from this IP' }
});
app.use('/api/', limiter);

// Request Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

/**
 * PRODUCTION ROUTES
 */

// Core AI Layer - MCP Integration Routes
app.use('/mcp', mcpRoutes);

// Blockchain Audit Routes
app.use('/api/blockchain', blockchainRoutes);

// Mount all modular API routes
app.use('/api', apiRoutes);

// Unified Health Check (Optimized for Keep-Alive Pings)
app.get('/health', (req, res) => {
    logger.info(`[CRON] Keep-alive ping received at ${new Date().toISOString()}`);

    res.status(200).json({
        status: "ok",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * Error Handling
 */

// Not Found Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`[STABLE] Backend server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
