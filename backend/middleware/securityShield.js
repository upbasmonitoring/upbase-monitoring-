import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from '../config/redis.js';
import Security from '../models/Security.js';

// Layer 1: Rate Limiters
import { getRedisStatus } from '../config/redis.js';

let ipLimiter;
let keyLimiter;
export let rumLimiter;

if (!getRedisStatus().isMock) {
    ipLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'rl:ip',
      points: 100,
      duration: 60,
      blockDuration: 300,
    });

    keyLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'rl:key',
      points: 1000,
      duration: 60,
      blockDuration: 60,
    });
    
    
    const rumRateLimiter = new RateLimiterRedis({
       storeClient: redis,
       keyPrefix: 'rl:rum',
       points: 50,          // Strict 50 reqs/min per IP
       duration: 60,
       blockDuration: 60,
    });
    rumLimiter = async (req, res, next) => {
       try {
           await rumRateLimiter.consume(req.ip);
           next();
       } catch (rejRes) {
           res.status(429).json({ error: 'RUM Rate Limit Exceeded' });
       }
    };
} else {
    // In-Memory Fallback Mocks
    ipLimiter = { consume: async () => true };
    keyLimiter = { consume: async () => true };
    rumLimiter = (req, res, next) => next(); 
}

const ATTACK_PATTERNS = [
  { type: 'SQLi',  pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b.*\b(FROM|INTO|WHERE|TABLE)\b)/i },
  { type: 'XSS',   pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i },
  { type: 'PathTraversal', pattern: /\.\.\/|\.\.\\|%2e%2e/i },
  { type: 'CmdInjection',  pattern: /[;|&`$].*?(rm|cat|ls|wget|curl|bash|sh|python|perl)\s/i },
];

/**
 * 🧱 High-Performance Security Guard
 * Drops connections from known malicious IPs instantly using Redis logic.
 * Scans for common attack patterns and manages rate limiting.
 */
export const securityShield = async (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        // 1. IP Blacklist check (fast memory check via Redis)
        const isBlacklisted = await redis.sismember('blacklist:ips', ip);
        if (isBlacklisted) {
            console.log(`[SECURITY] 🛡️ Blocked request from blacklisted IP: ${ip}`);
            return res.status(403).json({ 
                message: 'Access Denied: Your IP has been flagged by the Sentinel Shield for suspicious activity.' 
            });
        }

        // 2. IP Rate limiting
        await ipLimiter.consume(ip);

        // 3. API Key Rate limiting (if applicable)
        if (req.apiKey) {
            await keyLimiter.consume(req.apiKey.id);
        }

        // 4. Malware Pattern Detection
        const toScan = JSON.stringify({ query: req.query, body: req.body, params: req.params });
        for (const { type, pattern } of ATTACK_PATTERNS) {
            if (pattern.test(toScan)) {
                await trackSuspicious(ip, `Malicious pattern: ${type}`, 'high', { path: req.path });
                return res.status(400).json({ error: 'Suspected malicious request' });
            }
        }

        next();
    } catch (err) {
        if (err.msBeforeNext) {
            return res.status(429).json({ 
                message: 'Too many requests from this IP. Please wait.', 
                retryAfter: Math.round(err.msBeforeNext / 1000) 
            });
        }
        
        // Suppress specific Redis-iteration noise during connection failovers
        if (!err.message.includes('iterable')) {
            console.error('[SECURITY-SENTINEL] Failover Passthrough:', err.message);
        }
        
        next();
    }
};

/**
 * 🕵️ Suspicious Activity Tracker
 * Use this to report auth fails, rate-limits, or bad-actors.
 */
export const trackSuspicious = async (ip, reason, severity = 'medium', metadata = {}) => {
    try {
        // Log to database
        const action = severity === 'high' ? 'block' : 'warn';
        await Security.create({ ip, action, reason, severity, metadata });
        
        // AUTO-BLACK-LIST Logic: If too many events in short time
        const attempts = await redis.incr(`sec:attempts:${ip}`);
        if (attempts === 1) await redis.expire(`sec:attempts:${ip}`, 3600); // 1 hour window

        if (attempts >= 10) {
            console.log(`[SECURITY] 🧱 Banning IP ${ip} after ${attempts} violations: ${reason}`);
            await redis.sadd('blacklist:ips', ip);
            await redis.expire('blacklist:ips', 86400); // 24 hours ban
        }
    } catch (err) {
        console.error('[SECURITY] Event Tracking Error:', err.message);
    }
};
