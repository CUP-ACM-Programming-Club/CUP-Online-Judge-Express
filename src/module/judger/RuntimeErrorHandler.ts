const query = require("../mysql_query");
const log4js = require("../logger");
const logger = log4js.logger("normal", "info");

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