const query = require("../../infrastructure/db/legacy/mysql_query");
import { getLogger } from "../ports/Logger";
const logger = getLogger("normal", "info");

class RuntimeErrorHandler {


	record(solutionId: any, runnerId: any) {
		query("update solution set result = 16 where solution_id = ?", [solutionId]);
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