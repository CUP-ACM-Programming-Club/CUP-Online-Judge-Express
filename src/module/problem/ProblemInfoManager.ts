const sequelize = require("../../orm/instance/sequelize");
const Problem = sequelize.import("problem", require("../../orm/models/problem"));
import ProblemCachePool from "./ProblemCachePool";
import AwaitLock from "await-lock";
const lock = new AwaitLock();

class ProblemInfoManager {
	problemId: any;
	constructor() {
	}

	static newInstance() {
		return new ProblemInfoManager();
	}

	buildCacheKey() {
		return "ProblemInfoManager: " + this.problemId;
	}

	setProblemId(problemId: any) {
		this.problemId = problemId;
		return this;
	}

	removeCache() {
		ProblemCachePool.remove(this.buildCacheKey());
		return this;
	}

	async find() {
		try {
			await lock.acquireAsync();
			const cache = await ProblemCachePool.get(this.buildCacheKey());
			if (cache) {
				lock.release();
				return cache.data;
			}
			const response = await Problem.findOne({
				where: {
					problem_id: this.problemId
				}
			});
			ProblemCachePool.set(this.buildCacheKey(), response);
			lock.release();
			return response;
		} catch (e) {
			console.log(e);
			lock.release();
			return null;
		}
	}
}

export = ProblemInfoManager;
