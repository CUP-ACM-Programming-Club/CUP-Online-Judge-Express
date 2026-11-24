import { query } from "../../db";
import { LegacyUtilRepository } from "../../../application/ports/LegacyUtilRepository";

export class MySqlLegacyUtilRepository implements LegacyUtilRepository {
	async removeAllContestProblem(contest_id: number | string): Promise<void> {
		await query("delete from contest_problem where contest_id = ?", [contest_id]);
	}

	async removeAllContestProblemWithTransaction(connection: any, contest_id: number | string): Promise<void> {
		await connection.query("delete from contest_problem where contest_id = ?", [contest_id]);
	}

	async removeAllCompetitorPrivilege(contest_id: number | string): Promise<void> {
		await query("delete from privilege where rightstr = ?", [`c${contest_id}`]);
	}

	async removeAllCompetitorPrivilegeWithTransaction(connection: any, contest_id: number | string): Promise<void> {
		await connection.query("delete from privilege where rightstr = ?", [`c${contest_id}`]);
	}

	async addContestProblem(contest_id: number | string, problemList: any[]): Promise<void> {
		let baseSql = "insert into contest_problem(contest_id, problem_id, num) values";
		let sqlArray: string[] = [];
		let valueArray: any[] = [];
		for (let num = 0, len = problemList.length; num < len; ++num) {
			sqlArray.push("(?,?,?)");
			valueArray.push(contest_id, problemList[num], num);
		}
		await query(`${baseSql} ${sqlArray.join(",")}`, valueArray);
	}

	async addContestProblemWithTransaction(connection: any, contest_id: number | string, problemList: any[]): Promise<void> {
		let baseSql = "insert into contest_problem(contest_id, problem_id, num) values";
		let sqlArray: string[] = [];
		let valueArray: any[] = [];
		for (let num = 0, len = problemList.length; num < len; ++num) {
			sqlArray.push("(?,?,?)");
			valueArray.push(contest_id, problemList[num], num);
		}
		await connection.query(`${baseSql} ${sqlArray.join(",")}`, valueArray);
	}

	async addContestCompetitor(contest_id: number | string, userList: any[]): Promise<void> {
		if (userList.length === 0) {
			return;
		}
		let baseSql = "insert into privilege (user_id, rightstr) values";
		let sqlArray: string[] = [], valueArray: any[] = [];
		userList.forEach(el => {
			sqlArray.push("(?,?)");
			valueArray.push(el, `c${contest_id}`);
		});
		await query(`${baseSql} ${sqlArray.join(",")}`, valueArray);
	}

	async addContestCompetitorWithTransaction(connection: any, contest_id: number | string, userList: any[]): Promise<void> {
		if (userList.length === 0) {
			return;
		}
		let baseSql = "insert into privilege (user_id, rightstr) values";
		let sqlArray: string[] = [], valueArray: any[] = [];
		userList.forEach(el => {
			sqlArray.push("(?,?)");
			valueArray.push(el, `c${contest_id}`);
		});
		await connection.query(`${baseSql} ${sqlArray.join(",")}`, valueArray);
	}

	startupInit(): Promise<any> {
		return query("UPDATE solution SET result = 1 WHERE result > 0 and result < 4");
	}
}
