import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import { systemLog } from "../../../application/ports/SystemInfo";

class SystemLogController {
	@ErrorHandlerFactory(ok.okMaker)
	async getStdoutLog(line: number = 10) {
		return await systemLog.getStdoutLog(line);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getStderrLog(line: number = 10) {
		return await systemLog.getStderrLog(line);
	}
}

export default new SystemLogController();
