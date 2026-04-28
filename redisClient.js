const Redis = require('ioredis');
const redis = new Redis();

redis.on('connect', () => console.log("Redis connected"));

module.exports = redis;