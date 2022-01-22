import {Request} from "express";
import SubmissionManager, {ExportSolutionInfo, SolutionInfoDAO} from "./SubmissionManager";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import CompileInfoManager from "../judge/CompileInfoManager";
import RuntimeInfoManager from "../judge/RuntimeInfoManager";
import {ConfigManager} from "../../module/config/config-manager";
import Mustache from "mustache";

const COMPILE_ERROR = 11;
const TEST_RUN = 13;
interface SolutionInfoDTO {
    state: number,
    compile_info?: string,
    pass_point: number,
    time: number,
    memory: number,
    test_run_result?: string
}

class SolutionManagerPrivilegeValidator {
    async validate (req: Request, solutionId: number) {
        const isadmin = req.session!.isadmin;
        if (isadmin) {
            return;
        }
        const userId =  req.session!.user_id;
        const response = await SubmissionManager.getSolutionInfo(solutionId);
        if (response!.user_id !== userId) {
            throw new Error("No privilege to access");
        }
    }
}

class SolutionManager {
    validator = new SolutionManagerPrivilegeValidator();
    async convertDaoToDto(solutionDao: SolutionInfoDAO) {
        const solutionInfoDTO: SolutionInfoDTO = {
            compile_info: "", memory: solutionDao.memory, pass_point: solutionDao.pass_point, state: solutionDao.result, test_run_result: "", time: solutionDao.time
        };
        switch (solutionInfoDTO.state) {
            case COMPILE_ERROR:
                solutionInfoDTO.compile_info = (await CompileInfoManager.getCompileInfoBySolutionId(solutionDao.solution_id))!.error;
                break;
            case TEST_RUN:
                solutionInfoDTO.test_run_result = (await RuntimeInfoManager.getRuntimeInfoBySolutionId(solutionDao.solution_id))!.error;
                break;
            default:
                break;
        }
        return solutionInfoDTO;
    }

    convertFormatToMustache (exportSolutionInfoList:　ExportSolutionInfo[]) {
        let output = "";
        const template = ConfigManager.getConfig("export_solution_template"
            , `UserId: {{{user_id}}}\nProblem Id:{{{problem_id}}}\nSolutionId: {{{solution_id}}}\nNick:{{{nick}}}\nSource\n{{{source}}}\n`);
        for (let exportSolutionInfo of exportSolutionInfoList) {
            output += Mustache.render(template, exportSolutionInfo);
        }
        return output;
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getSolutionInfoByRequest(req: Request) {
        const solutionId  = parseInt(req.params.solutionId);
        await this.validator.validate(req, solutionId);
        const solutionDAO = await SubmissionManager.getSolutionInfo(solutionId);
        return await this.convertDaoToDto(solutionDAO!);
    }

    async getSolutionExportInfoByContestId(req: Request) {
        const contestId = parseInt(req.params.contestId);
        const exportSolutionInfoList = await SubmissionManager.getSolutionExportInfoByContestId(contestId);
        return this.convertFormatToMustache(exportSolutionInfoList);
    }
}

export default new SolutionManager();
