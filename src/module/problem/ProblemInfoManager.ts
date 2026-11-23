const sequelize = require("../../orm/instance/sequelize");
// sequelize v6 移除了 sequelize.import()；它对 (name, defineFn) 的调用等价于 defineFn(sequelize, DataTypes)
const { DataTypes } = require("sequelize");
const Problem = require("../../orm/models/problem")(sequelize, DataTypes);
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
