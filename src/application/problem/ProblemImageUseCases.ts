import { problemImageStorage } from "../ports/ProblemImageStorage";

/** 题面图片读取。 */
export class ProblemImageUseCases {
	async listImages(problemId: number, type: string) {
		return await problemImageStorage.readImages(problemId, type);
	}
}

export default new ProblemImageUseCases();
