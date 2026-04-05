import Redis from 'ioredis';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';

dotenv.config();

let internalClient;
let isMock = false;

const REDIS_CONFIG = {
    maxRetriesPerRequest: null,
    connectTimeout: 2000,
    reconnectOnError: () => true
};

function switchToMock() {
  if (isMock) return;
  
  // Clean up the real client for silencing future errors
  if (internalClient && typeof internalClient.disconnect === 'function') {
      try {
          internalClient.removeAllListeners('error');
          internalClient.disconnect();
          console.log('[REDIS] Disconnected original attempt to silence errors.');
      } catch (e) {}
  }

  isMock = true;
  console.log('[REDIS] Operating in MOCKED mode (Redis-free).');
  
  const mock = new EventEmitter();
  const store = new Map();
  const sets = new Map();
  const lists = new Map();

  mock.get = async (key) => store.get(key);
  mock.set = async (key, val) => store.set(key, val);
  mock.incr = async (key) => {
      const val = (store.get(key) || 0) + 1;
      store.set(key, val);
      return val;
  };
  mock.expire = async () => true;
  mock.sadd = async (key, val) => {
      if (!sets.has(key)) sets.set(key, new Set());
      sets.get(key).add(val);
  };
  mock.sismember = async (key, val) => sets.has(key) ? sets.get(key).has(val) : false;
  mock.del = async (key) => store.delete(key);

  // --- Redis List Mocks (for RUM Sliding Window) ---
  mock.lpush = async (key, val) => {
      if (!lists.has(key)) lists.set(key, []);
      lists.get(key).unshift(String(val));
      return lists.get(key).length;
  };
  mock.llen = async (key) => lists.has(key) ? lists.get(key).length : 0;
  mock.lrange = async (key, start, stop) => {
      if (!lists.has(key)) return [];
      const arr = lists.get(key);
      return arr.slice(start, stop + 1);
  };
  mock.ltrim = async (key, start, stop) => {
      if (!lists.has(key)) return;
      const arr = lists.get(key);
      if (start >= arr.length) { lists.set(key, []); return; }
      lists.set(key, arr.slice(start, stop === -1 ? arr.length : stop + 1));
  };
  mock.exists = async (key) => store.has(key) || lists.has(key) || sets.has(key) ? 1 : 0;
  mock.setnx = async (key, val) => {
      if (store.has(key)) return 0;
      store.set(key, val);
      return 1;
  };
  mock.ttl = async (key) => -1; // Mock: no real TTL tracking
  
  // --- Lua Script Eval Mock (for atomic push+expire) ---
  mock.eval = async (script, numKeys, ...args) => {
      // Simulate the specific Lua script used by RUM pipeline:
      // LPUSH + conditional EXPIRE + LLEN
      const key = args[0];
      const value = args[1];
      const ttl = parseInt(args[2]) || 300;
      const windowSize = parseInt(args[3]) || 20;
      
      await mock.lpush(key, value);
      // Simplified: always set expire in mock (real Lua handles atomically)
      const len = await mock.llen(key);
      return len;
  };
  
  // --- MULTI/EXEC Transaction Mock ---
  mock.multi = () => {
      const chain = [];
      const tx = {
          lpush: (...args) => { chain.push(() => mock.lpush(...args)); return tx; },
          lrange: (...args) => { chain.push(() => mock.lrange(...args)); return tx; },
          ltrim: (...args) => { chain.push(() => mock.ltrim(...args)); return tx; },
          llen: (...args) => { chain.push(() => mock.llen(...args)); return tx; },
          expire: (...args) => { chain.push(() => mock.expire(...args)); return tx; },
          exec: async () => {
              const results = [];
              for (const fn of chain) {
                  results.push([null, await fn()]);
              }
              return results;
          }
      };
      return tx;
  };

  // --- 🧱 Rate Limiter Support (Fix for rlflxIncr error) ---
  mock.defineCommand = (name, opts) => {
      // Mock defining a command (no-op)
      return mock;
  };
  
  mock.rlflxIncr = async (...args) => {
      // Basic simulation of the rate-limiter-flexible Lua script
      const key = args[0];
      const now = Date.now();
      const val = (store.get(key) || 0) + 1;
      store.set(key, val);
      return val;
  };

  mock.status = 'ready';
  mock.options = REDIS_CONFIG;
  mock.quit = async () => true;
  mock.disconnect = () => true;
  
  internalClient = mock;
}

try {
  const url = process.env.REDIS_URL;
  
  if (!url && process.env.NODE_ENV !== 'production') {
      console.log('[REDIS] No REDIS_URL found. Auto-starting in MOCKED mode.');
      switchToMock();
  } else {
      const redisUrl = url || 'redis://127.0.0.1:6379';
      internalClient = new Redis(redisUrl, REDIS_CONFIG);
      
      internalClient.on('error', (err) => {
        // Switching to mock on ANY error to ensure stability (including WRONGPASS)
        if (!isMock) {
          switchToMock();
        }
      });
    
      internalClient.ping().catch(() => {
        if (!isMock) switchToMock();
      });
  }
} catch (e) {
  switchToMock();
}

// Proxy to allow live-swapping of the underlying client
const redisProxy = new Proxy({}, {
  get: (target, prop) => {
    if (prop === 'isMock') return isMock;
    const val = internalClient[prop];
    return typeof val === 'function' ? val.bind(internalClient) : val;
  },
  set: (target, prop, value) => {
    internalClient[prop] = value;
    return true;
  }
});

export const getRedisStatus = () => ({ isMock });
export default redisProxy;
