import MySQLCachePool from "../../module/mysql/cache";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import {Request} from "express";
class MySQLCacheManager {
	removeCache(key: string) {
		MySQLCachePool.remove(key);
		return this;
	}

	@ErrorHandlerFactory(ok.okMaker)
	async removeCacheByRequest(req: Request) {
		this.removeCache(req.params.key);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async removeAllCacheByRequest(req: Request) {
		this.removeAllCache();
	}

	removeAllCache() {
		MySQLCachePool.removeAll();
		return this;
	}

	getCacheKey() {
		return MySQLCachePool.getAllKey();
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getCacheKeyByRequest(req: Request) {
		return this.getCacheKey();
	}
}

export = new MySQLCacheManager();
