import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import ProblemDataUseCases from "../../../application/problem/ProblemDataUseCases";

/** 后台题目数据文件上传/删除：从请求取参数，结果包成 {status, data|statement}。 */
class ProblemDataController {
	@ErrorHandlerFactory(ok.okMaker)
	async setFile(req: Request) {
		const problemId = req.params.problemId as string;
		return await ProblemDataUseCases.setSingleFile(problemId, req.file!);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async setMultipleFiles(req: Request) {
		const files = req.files as unknown as Express.Multer.File[];
		return await ProblemDataUseCases.setMultipleFiles(req.params.problemId as string, files);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async removeFile(req: Request) {
		const fileName = req.params.fileName;
		const problemId = req.params.problemId;
		return await ProblemDataUseCases.removeFile(problemId, fileName);
	}
}

export default new ProblemDataController();
