import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from '../config/redis.js';
import axios from 'axios';
import Security from '../models/Security.js'; // Existing security logs model

// Layer 1: Rate Limiters
const ipLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:ip',
  points: 100, // 100 requests per minute per IP
  duration: 60,
  blockDuration: 300, // Block for 5 minutes if exceeded
});

const keyLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:key',
  points: 1000,
  duration: 60,
  blockDuration: 60,
});

const ATTACK_PATTERNS = [
  { type: 'SQLi',  pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b.*\b(FROM|INTO|WHERE|TABLE)\b)/i },
  { type: 'XSS',   pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i },
  { type: 'PathTraversal', pattern: /\.\.\/|\.\.\\|%2e%2e/i },
  { type: 'CmdInjection',  pattern: /[;|&`$].*?(rm|cat|ls|wget|curl|bash|sh|python|perl)\s/i },
];

/**
 * 🔒 Security Middleware — The Multi-Layer Shield
 */
export async function securityGuard(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    // 1. IP Blacklist check (fast)
    const isBlacklisted = await redis.sismember('blacklist:ips', ip);
    if (isBlacklisted) return res.status(403).json({ error: 'Access denied: IP blacklisted' });

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
        console.warn(`[SECURITY] Potential ${type} attack detected from ${ip}`);
        
        // Log event
        await Security.create({
          type: 'attack_pattern',
          ip,
          path: req.path,
          details: `Detected ${type} signature`,
          severity: 'high',
          timestamp: new Date(),
        });

        // Trigger auto-blacklist on multiple attempts
        const attempts = await redis.incr(`sec:attempts:${ip}`);
        if (attempts >= 3) {
          await redis.sadd('blacklist:ips', ip);
          await redis.expire('blacklist:ips', 86400); // 24 hours
        }

        return res.status(400).json({ error: 'Suspected malicious request' });
      }
    }

    next();
  } catch (err) {
    if (err.msBeforeNext) {
      return res.status(429).json({ 
        message: 'Too many requests', 
        retryAfter: Math.round(err.msBeforeNext / 1000) 
      });
    }
    console.error('[SECURITY-SHIELD] Error:', err.message);
    next(); // Pass through on internal errors to avoid downtime
  }
}
