import { ContestCheatRecord, ContestCheatRepository } from "../../../application/ports/ContestCheatRepository";
import { query } from "../../db";

/** contest_cheat 表。SQL 逐字搬自原 application/contest/cheating_ban。 */
export class MySqlContestCheatRepository implements ContestCheatRepository {
	insertCheat(payload: ContestCheatRecord) {
		const {user_id, solution_id, contest, num} = payload;
		return query("insert into contest_cheat(contest_id, solution_id, user_id, num, checked) values(?,?,?,?,?)",
			[contest, solution_id, user_id, num, false]);
	}

	markChecked(solutionId: number | string) {
		return query("update contest_cheat set checked = true where solution_id = ?", [solutionId]);
	}

	findCheats(userId: string, contest: number | string) {
		return query("select * from contest_cheat where user_id = ? and contest_id = ?", [userId, contest]);
	}
}

export default new MySqlContestCheatRepository();
