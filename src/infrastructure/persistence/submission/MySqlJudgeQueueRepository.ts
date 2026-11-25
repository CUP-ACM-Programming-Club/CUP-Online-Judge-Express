import { MySQLManager } from "../../db/mysql/MySQLManager";
import { JudgeQueueRepository } from "../../../application/ports/JudgeQueueRepository";

const query = require("../../db/legacy/mysql_query");

/** 判题队列相关 SQL（自 UnjudgedSubmissionCollector / update_solution_result / RuntimeErrorHandler 原样搬来）。 */
export class MySqlJudgeQueueRepository implements JudgeQueueRepository {
	findWaitingSubmissions(noDataProblemIds: any[], limit: number) {
		return MySQLManager.execQuery("SELECT solution_id,user_id FROM solution WHERE result=0 and language not in (15,22) and problem_id != 0 and problem_id not in (?) order by solution_id limit ?", [noDataProblemIds, limit]);
	}

	findRejudgeSubmissions(noDataProblemIds: any[], limit: number) {
		return MySQLManager.execQuery("SELECT solution_id,user_id FROM solution WHERE result=1 and language not in (15,22) and problem_id != 0 and problem_id not in (?) order by solution_id desc limit ?", [noDataProblemIds, limit]);
	}

	countAdministrator(userId: string) {
		return MySQLManager.execQuery("SELECT count(1) as cnt from privilege where user_id = ? and rightstr = 'administrator'",
			[userId]);
	}

	markSubmitFailed(solutionId: number | string) {
		return MySQLManager.execQuery("update solution set result=15 where solution_id = ?", [solutionId]);
	}

	markRuntimeFatal(solutionId: any) {
		return query("update solution set result = 16 where solution_id = ?", [solutionId]);
	}

	resetSolutionStatus(idName: string, id: number | string) {
		// Reset result to 1 (Pending/Rejudging) and clear performance metrics
		return query(`UPDATE solution 
                 SET result = 1, 
                     time = 0, 
                     memory = 0, 
                     pass_rate = 0, 
                     pass_point = 0, 
                     judger = 'Waiting' 
                 WHERE ${idName} = ?`, [id]);
	}

	setSolutionResult(idName: string, id: number | string, result: number | string) {
		return query(`UPDATE solution SET result = ? WHERE ${idName} = ?`, [result, id]);
	}

	findSolutionOwner(solutionId: number) {
		return query("SELECT user_id, contest_id FROM solution WHERE solution_id = ?", [solutionId]);
	}

	countAdministratorForRejudge(userId: string) {
		return query("SELECT count(1) as cnt FROM privilege WHERE user_id = ? AND rightstr = 'administrator'", [userId]);
	}

	async claimForJudging(solutionId: number | string, leaseSeconds: number) {
		// InnoDB 行锁保证：两台服务器同时执行，只有一条 UPDATE 的 affectedRows 为 1
		const res: any = await MySQLManager.execQuery(
			"UPDATE solution SET result = 14, judgetime = NOW() WHERE solution_id = ? AND (result IN (0, 1) OR (result = 14 AND judgetime < NOW() - INTERVAL ? SECOND))",
			[solutionId, leaseSeconds]);
		return !!res && res.affectedRows === 1;
	}

	findStaleClaimedSubmissions(noDataProblemIds: any[], leaseSeconds: number, limit: number) {
		return MySQLManager.execQuery("SELECT solution_id,user_id,result FROM solution WHERE result=14 and judgetime < NOW() - INTERVAL ? SECOND and language not in (15,22) and problem_id != 0 and problem_id not in (?) order by solution_id limit ?", [leaseSeconds, noDataProblemIds, limit]);
	}
}
