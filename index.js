const Redis = require("ioredis");
const clients = require("./clientDB");

class Client {
  constructor(redisUri) {
    this.redisUri = redisUri;
    this.redis = new Redis(redisUri);

    ["get", "set", "del", "on", "sub", "pub"].forEach(
      method => (this[method] = this[method].bind(this))
    );
  }

  get(key) {
    return this.redis.get(key);
  }

  set(key, value) {
    return this.redis.set(key, value, "EX", 604800000);
  }

  del(key) {
    return this.redis.del(key);
  }

  on(info, handler) {
    if (!this.subRedis) {
      this.subRedis = new Redis(this.redisUri);
    }

    return this.subRedis.on(info, handler);
  }

  sub() {
    if (!this.subRedis) {
      this.subRedis = new Redis(this.redisUri);
    }

    this.subRedis.subscribe(...arguments);
  }

  pub() {
    if (!this.pubRedis) {
      this.pubRedis = new Redis(this.redisUri);
    }

    this.pubRedis.publish(...arguments);
  }
}

/**
 * @param redisConfig {object} {[name]:[redis://user:password@redis-service.com:port/db]}
 */
const init = redisConfig => {
  Object.keys(redisConfig).forEach(redisName => {
    clients.set(redisName, new Client(redisConfig[redisName]));
  });
};

const proxiedRedisSet = new Proxy(init, {
  get(target, clientName) {
    return clients.get(clientName);
  }
});

module.exports = proxiedRedisSet;
