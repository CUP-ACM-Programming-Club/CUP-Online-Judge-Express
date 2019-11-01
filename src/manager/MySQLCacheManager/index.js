const MySQLCachePool = require("../../module/mysql/cache");

class MySQLCacheManager {
	removeCache(key) {
		MySQLCachePool.remove(key);
		return this;
	}

	removeAllCache() {
		MySQLCachePool.removeAll();
		return this;
	}

	getCacheKey() {
		return MySQLCachePool.getAllKey();
	}
}

module.exports = new MySQLCacheManager();
