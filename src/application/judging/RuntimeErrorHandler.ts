import { judgeQueueRepository } from "../ports/JudgeQueueRepository";
import { getLogger } from "../ports/Logger";
const logger = getLogger("normal", "info");

class RuntimeErrorHandler {


	record(solutionId: any, runnerId: any) {
		judgeQueueRepository.markRuntimeFatal(solutionId);
		logger.fatal(`Fatal Error:\n
				solution_id:${solutionId}\n
				runner_id:${runnerId}\n
				`);
		if (process.env.NODE_ENV === "test") {
			console.log(`Fatal Error:\n
				solution_id:${solutionId}\n
				runner_id:${runnerId}\n
				`);
		}
	}
}

export = RuntimeErrorHandler;