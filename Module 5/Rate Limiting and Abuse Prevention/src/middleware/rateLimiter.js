'use strict';
// middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');

/**
 * Multi-Instance Scaling & Redis-Backed Store:
 *
 * 1. Why the default MemoryStore fails in production:
 *    By default, express-rate-limit keeps counters in Node process memory (MemoryStore).
 *    When scaling horizontally across multiple server instances behind a load balancer,
 *    each instance maintains its own isolated counter. If a client distributes requests
 *    across N instances, they effectively receive N * max allowed requests (e.g., 5 attempts
 *    limit across 3 instances allows 15 attempts before being blocked).
 *
 * 2. Why and how a Redis-backed store (rate-limit-redis) replaces it:
 *    A Redis-backed store moves the request counter into a shared, centralized Redis database.
 *    Because Redis operations are atomic, fast, and accessible by all application instances,
 *    every server instance checks and increments the same global counter. This guarantees
 *    that the rate limit (e.g. 5 attempts per 15 minutes) is enforced cluster-wide regardless
 *    of which instance handles the incoming request.
 *
 *    Example configuration with rate-limit-redis:
 *      const { RedisStore } = require('rate-limit-redis');
 *      const { createClient } = require('redis');
 *      const redisClient = createClient({ url: process.env.REDIS_URL });
 *      redisClient.connect();
 *
 *      const authLimiter = rateLimit({
 *        windowMs: 15 * 60 * 1000,
 *        max: 5,
 *        standardHeaders: true,
 *        legacyHeaders: false,
 *        skipSuccessfulRequests: true,
 *        store: new RedisStore({
 *          sendCommand: (...args) => redisClient.sendCommand(args),
 *        }),
 *      });
 */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skipSuccessfulRequests: true, // Only failed attempts count
  message: {
    error: 'Too many requests, please try again later.',
  },
  handler: (req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = authLimiter;
