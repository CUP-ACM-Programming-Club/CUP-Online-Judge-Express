import {ErrorHandlerFactory} from "../../shared/decorators/ErrorHandler";
import {ok} from "../../domain/constants/state";
import {BanDAO, userBanRepository} from "../ports/UserBanRepository";
import UserUseCases from "./UserUseCases";

interface BanDTO extends BanDAO{
	nick: string
}

class Ban {
	async getAll() {
		return await userBanRepository.getAll();
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getAllByRequest(_req?: unknown) {
		const result = await this.getAll();
		return await Promise.all(result.map(async e => {
			const nick = await UserUseCases.getUserNick(e.user_id);
			return Object.assign({nick}, e) as BanDTO;
		}));
	}

	async get(userId: string) {
		return await userBanRepository.get(userId);
	}

	async set(userId: string, datetime: string) {
		await userBanRepository.set(userId, datetime);
	}

	async remove(userId: string) {
		await userBanRepository.remove(userId);
	}

	/** 封禁检查（带 2s 读缓存）：返回 bantime 行 */
	async getBanTimeRows(userId: string) {
		return await userBanRepository.getBanTimeRows(userId);
	}
}

export = new Ban();
