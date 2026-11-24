import { query } from "../../db";
import { AdminTableRepository } from "../../../application/ports/AdminTableRepository";

/** SQL 与重构前 module/admin/{baseGetter,defunct,list} 逐字一致。 */
export class MySqlAdminTableRepository implements AdminTableRepository {
	findById(table: string, idColumn: string, id: string | number) {
		return query(`select * from ${table} where ${idColumn} = ?`, [id]);
	}

	getDefunct(table: string, idColumn: string, id: string | number) {
		return query(`select defunct from ${table} where ${idColumn} = ?`, [id]);
	}

	setDefunct(table: string, idColumn: string, id: string | number, defunct: string) {
		return query(`update ${table} set defunct = ? where ${idColumn} = ?`, [defunct, id]);
	}

	page(table: string, where: string, orderBy: string, offset: number, size: number) {
		return query(`select * from ${table} ${[where, orderBy].join(" ")} limit ${offset},${size}`);
	}

	count(table: string, where: string, orderBy: string) {
		return query(`select count(1) as cnt from ${table} ${[where, orderBy].join(" ")}`);
	}
}
