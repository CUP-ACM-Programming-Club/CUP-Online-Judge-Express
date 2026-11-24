import { MySQLManager } from "../../db/mysql/MySQLManager";
import SubmissionManager from "./SubmissionManager";
import { JudgeResultRepository } from "../../../application/ports/JudgeResultRepository";

const query = require("../../db/legacy/mysql_query");
const cache_query = require("../../db/legacy/mysql_cache");

/** 判题结果回写相关 SQL（自 judging/recorder、recorder/Maintainer、recorder/ScoreboardInvalidator 原样搬来）。 */
export class MySqlJudgeResultRepository implements JudgeResultRepository {
	updateSolutionResult(time: any, memory: any, result: any, passPoint: any, passRate: any, judger: any, solutionId: any) {
		return query("update solution set time = ?, memory = ?, result = ?, pass_point = ?, pass_rate = ?, judger = ? where solution_id = ? and result != 4",
			[time, memory, result, passPoint, passRate, judger, solutionId]);
	}

	findAdministratorPrivilege(userId: string) {
		return cache_query(`select rightstr from privilege where user_id = ? and rightstr = 'administrator'`, [userId]);
	}

	upsertSim(solutionId: any, simSolutionId: any, sim: any) {
		return query("insert into sim(s_id,sim_s_id,sim) values(?,?,?) on duplicate key update  sim_s_id=?,sim=?", [solutionId, simSolutionId, sim, simSolutionId, sim]);
	}

	deleteCompileInfo(solutionId: any) {
		return query("delete from compileinfo where solution_id = ?", [solutionId]);
	}

	insertCompileInfo(solutionId: any, info: any) {
		return query("insert into compileinfo values(?, ?)  on duplicate key update  error = ?", [solutionId, info, info]);
	}

	deleteRuntimeInfo(solutionId: any) {
		return query("delete from runtimeinfo where solution_id = ?", [solutionId]);
	}

	insertRuntimeInfo(solutionId: any, info: any) {
		return query("insert into runtimeinfo values(?, ?) on duplicate key update error = ?", [solutionId, info, info]);
	}

	getSolutionInfo(solutionId: number) {
		return SubmissionManager.getSolutionInfo(solutionId);
	}

	findContestIdBySolution(solutionId: number | string): Promise<any[]> {
		return MySQLManager.execQuery("select contest_id from solution where solution_id = ?", [solutionId]);
	}

	updateUserSolved(userId: string) {
		return query("UPDATE `users` SET `solved`=(SELECT count(DISTINCT `problem_id`) FROM `solution` WHERE `user_id`= ? AND `result`='4') WHERE `user_id`= ?", [userId, userId]);
	}

	updateUserSubmit(userId: string) {
		return query("UPDATE `users` SET `submit`=(SELECT count(*) FROM `solution` WHERE `user_id`= ? and problem_id>0) WHERE `user_id`= ?", [userId, userId]);
	}

	updateProblemAccepted(problemId: number | string) {
		return query("UPDATE `problem` SET `accepted`=(SELECT count(*) FROM `solution` WHERE `problem_id`= ? AND `result`='4') WHERE `problem_id`= ?", [problemId, problemId]);
	}

	updateProblemSubmit(problemId: number | string) {
		return query("UPDATE `problem` SET `submit`=(SELECT count(*) FROM `solution` WHERE `problem_id`= ?) WHERE `problem_id`= ?", [problemId, problemId]);
	}
}
