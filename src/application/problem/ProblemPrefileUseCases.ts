import { PrefileCode, PrefileRow, problemPrefileRepository } from "../ports/ProblemPrefileRepository";

export interface PrefilePayload {
	payload: PrefileCode[];
	problemId: number | string;
}

const PREPEND = 1;
const APPEND = 0;

/** 题目前置/后置代码的读取与整体替换。 */
export class ProblemPrefileUseCases {
	private async getCode(problemId: number | string, prepend: number) {
		const payload: PrefilePayload = {
			payload: [],
			problemId
		};
		const data = await problemPrefileRepository.findByProblem(problemId, prepend);
		if (data && data.length && data.length > 0) {
			data.forEach((e: PrefileRow) => {
				payload.payload.push({
					language: e.type,
					code: e.code
				});
			});
		}
		return payload;
	}

	private async replaceCode(prefilePayload: PrefilePayload, prepend: number) {
		const problemId = prefilePayload.problemId;
		await problemPrefileRepository.deleteByProblem(problemId, prepend);
		for (const e of prefilePayload.payload) {
			await problemPrefileRepository.insert(problemId, prepend, e);
		}
	}

	getPrependCode(problemId: number | string) {
		return this.getCode(problemId, PREPEND);
	}

	getAppendCode(problemId: number | string) {
		return this.getCode(problemId, APPEND);
	}

	setPrependCode(payload: PrefilePayload) {
		return this.replaceCode(payload, PREPEND);
	}

	setAppendCode(payload: PrefilePayload) {
		return this.replaceCode(payload, APPEND);
	}
}

export default new ProblemPrefileUseCases();
