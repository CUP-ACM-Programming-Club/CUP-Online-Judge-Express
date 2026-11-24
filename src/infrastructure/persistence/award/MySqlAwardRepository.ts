import { MySQLManager } from "../../db/mysql/MySQLManager";
import { AwardInput, AwardRepository } from "../../../application/ports/AwardRepository";

export class MySqlAwardRepository implements AwardRepository {
	add(award: AwardInput) {
		return MySQLManager.execQuery("insert into award(user_id, award, year)values(?,?,?)", [award.userId, award.award, award.year]);
	}

	update(awardId: number, award: AwardInput) {
		return MySQLManager.execQuery("update award set user_id=?, award = ?, year = ? where award_id = ?", [award.userId, award.award, award.year, awardId]);
	}

	remove(awardId: number) {
		return MySQLManager.execQuery("delete from award where award_id = ?", [awardId]);
	}

	findById(awardId: number) {
		return MySQLManager.execQuery("select * from award where award_id = ?", [awardId]);
	}
}
