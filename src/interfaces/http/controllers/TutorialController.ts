import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import TutorialService from "../../../application/services/TutorialService";

/** 用户题解列表：结果包成 {status, data|statement}。 */
class TutorialController {
	@ErrorHandlerFactory(ok.okMaker)
	async getTutorialListByUserId(userId: string) {
		return await TutorialService.getTutorialListByUserId(userId);
	}
}

export default new TutorialController();
