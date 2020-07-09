import {Request} from "express";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../constants/state";
import UserManager from "../../manager/user/UserManager";
const query = require("../mysql_query");

interface BanDAO {
	user_id: string,
	bantime: string
}

interface BanDTO extends BanDAO{
	nick: string
}

class Ban {
	async getAll() {
		return await query("select bantime, user_id from ban_user") as BanDAO[];
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getAllByRequest(req: Request) {
		const result = await this.getAll();
		return await Promise.all(result.map(async e => {
			const nick = await UserManager.getUserNick(e.user_id);
			return Object.assign({nick}, e) as BanDTO;
		}));
	}

	async get(userId: string) {
		return await query("select * from ban_user where user_id = ?", [userId]);
	}

	async set(userId: string, datetime: string) {
		await query("INSERT INTO ban_user (user_id, bantime) VALUES(?,?) ON DUPLICATE KEY UPDATE user_id = ?, bantime = ?",
			[userId, datetime, userId, datetime]);
	}

	async remove(userId: string) {
		await query("delete from ban_user where user_id = ?", [userId]);
	}
}

export = new Ban();
