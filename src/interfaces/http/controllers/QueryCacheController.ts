import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import { queryCache } from "../../../application/ports/QueryCache";

class QueryCacheController {
	@ErrorHandlerFactory(ok.okMaker)
	async removeCacheByRequest(req: Request) {
		queryCache.removeCache(req.params.key);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async removeAllCacheByRequest(req: Request) {
		queryCache.removeAllCache();
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getCacheKeyByRequest(req: Request) {
		return queryCache.getCacheKey();
	}
}

export default new QueryCacheController();
