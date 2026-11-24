import MySQLCachePool from "../../db/legacy/mysql/cache";
import { QueryCache } from "../../../application/ports/QueryCache";

class MySQLCacheManager implements QueryCache {
	removeCache(key: string) {
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

export = new MySQLCacheManager();
