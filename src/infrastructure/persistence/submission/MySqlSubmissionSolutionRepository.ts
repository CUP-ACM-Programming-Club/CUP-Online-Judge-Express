import SubmissionManager from "./SubmissionManager";
import CompileInfoManager from "../judge/CompileInfoManager";
import RuntimeInfoManager from "../judge/RuntimeInfoManager";
import { SubmissionSolutionRepository } from "../../../application/ports/SubmissionSolutionRepository";

export class MySqlSubmissionSolutionRepository implements SubmissionSolutionRepository {
    getSolutionInfo(solutionId: number) {
        return SubmissionManager.getSolutionInfo(solutionId);
    }

    getCompileInfo(solutionId: number) {
        return CompileInfoManager.getCompileInfoBySolutionId(solutionId);
    }

    getRuntimeInfo(solutionId: number) {
        return RuntimeInfoManager.getRuntimeInfoBySolutionId(solutionId);
    }

    getSolutionExportInfoByContestId(contestId: number | string) {
        return SubmissionManager.getSolutionExportInfoByContestId(contestId);
    }
}
