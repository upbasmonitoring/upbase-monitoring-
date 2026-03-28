/**
 * logger.js — Production-grade structured logger
 * Wraps console with log levels + timestamps.
 * Drop-in replacement for console.log across the platform.
 */

const LEVELS = { info: 'INFO', warn: 'WARN', error: 'ERROR', debug: 'DEBUG' };

const format = (level, message, meta = '') => {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level}] ${message}${metaStr}`;
};

const logger = {
  info:  (msg, meta) => console.log(format(LEVELS.info,  msg, meta)),
  warn:  (msg, meta) => console.warn(format(LEVELS.warn,  msg, meta)),
  error: (msg, meta) => console.error(format(LEVELS.error, msg, meta)),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(format(LEVELS.debug, msg, meta));
    }
  },
};

export default logger;
