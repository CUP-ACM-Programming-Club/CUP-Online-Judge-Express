import path from "path";
interface JudgerConfig {
	oj_home: string,
	oj_judge_num: number
}

interface WebSocketConfig {
	websocket_client_port: number
	judger_port: number;
}

interface Config {
	judger: JudgerConfig,
	ws: WebSocketConfig,
	salt: string
}
declare global {
	namespace NodeJS {
		interface Global {
			config: Config
		}
	}
}
class ProblemFileManager {
	constructor() {
	}

	getProblemPath(problemId: string | number) {
		const ojHome = path.join(global.config.judger.oj_home, "data");
		return path.join(ojHome, problemId.toString());
	}

	getFilePath(problemId: string | number, fileName: string) {
		return path.join(this.getProblemPath(problemId), fileName);
	}
}

module.exports = new ProblemFileManager();
