import { problemDataStorage, UploadedProblemFile } from "../ports/ProblemDataStorage";

function isSpjFile(file_name: string) {
	return file_name.indexOf(".") === file_name.lastIndexOf(".") && file_name.indexOf("spj") === 0 && file_name.substring(3).indexOf(".") === 0;
}

/** 题目测试数据文件：列出、下载路径、上传、删除。 */
export class ProblemDataUseCases {
	getFilePath(problemId: string | number, fileName: string) {
		return problemDataStorage.getFilePath(problemId, fileName);
	}

	async setSingleFile(problemId: string, file: UploadedProblemFile) {
		return await problemDataStorage.setSingleFile(problemId, file);
	}

	async setMultipleFiles(problemId: string, files: UploadedProblemFile[]) {
		const result = [];
		for (const file of files) {
			await problemDataStorage.touchFolder(problemId);
			result.push(problemDataStorage.setSingleFile(problemId, file));
		}
		return await Promise.all(result);
	}

	async removeFile(problemId: string, fileName: string) {
		return await problemDataStorage.removeFile(problemId, fileName);
	}

	/** 数据目录里的测试数据文件（.in / .out / spj.*），忽略 ac 目录 */
	async listJudgeFiles(problemId: number) {
		const dirFile = await problemDataStorage.listFiles(problemId);
		let validFile = [];
		for (let file of dirFile) {
			if (file === "ac") {
				continue;
			}
			if (file.endsWith(".in")) {
				validFile.push(file);
			} else if (file.endsWith(".out")) {
				validFile.push(file);
			} else if (isSpjFile(file)) {
				validFile.push(file);
			}
		}
		return validFile;
	}
}

export default new ProblemDataUseCases();
