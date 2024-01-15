import {Request} from "express";
import SubmissionManager, {ExportSolutionInfo, RESULT_CHINESE_STRING, SolutionInfoDAO} from "./SubmissionManager";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import CompileInfoManager from "../judge/CompileInfoManager";
import RuntimeInfoManager from "../judge/RuntimeInfoManager";
import {ConfigManager} from "../../module/config/config-manager";
import Mustache from "mustache";
import dayjs from "dayjs";

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

    convertLastFormatToMustache (exportSolutionInfoList: ExportSolutionInfo[]) {
        let output = "";
        const template = ConfigManager.getConfig("export_last_solution_template"
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
        this.enhanceResultString(exportSolutionInfoList)
        return this.convertFormatToMustache(exportSolutionInfoList);
    }

    async getLastSolutionExportInfoByContestId(req: Request) {
        const contestId = parseInt(req.params.contestId);
        const exportSolutionInfoList = await SubmissionManager.getSolutionExportInfoByContestId(contestId);
        const userProblemInfoMap: {[id: string]: {[id: string]: ExportSolutionInfo[] | undefined } | undefined} = {};
        const resultProblemInfoMap: {[id: string]: {[id: string]: ExportSolutionInfo } | undefined} = {};
        const resultSolutionInfoList: ExportSolutionInfo[] = [];
        for (let exportSolutionInfo of exportSolutionInfoList) {
            const {user_id, problem_id} = exportSolutionInfo;
            if (problem_id < 0) {
                continue;
            }
            if (userProblemInfoMap[user_id] === undefined) {
                userProblemInfoMap[user_id] = {};
                resultProblemInfoMap[user_id] = {};
            }
            if (userProblemInfoMap[user_id]![problem_id] === undefined) {
                userProblemInfoMap[user_id]![problem_id] = [];
            }
            userProblemInfoMap[user_id]![problem_id]!.push(exportSolutionInfo);
        }
        for (let userProblemInfoMapKey in userProblemInfoMap) {
            for (let userProblemInfoMapElementKey in userProblemInfoMap[userProblemInfoMapKey]) {
                const list = userProblemInfoMap[userProblemInfoMapKey]![userProblemInfoMapElementKey]!
                list.sort((a, b) => {
                    const left = dayjs(a.in_date);
                    const right = dayjs(b.in_date);
                    if (left.isBefore(right)) {
                        return -1;
                    }
                    else if (left.isAfter(right)) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                })
                let firstErrorSolution: ExportSolutionInfo | undefined = undefined;
                let firstAcceptSolution: ExportSolutionInfo | undefined = undefined;
                for (let exportSolutionInfo of list) {
                    if (exportSolutionInfo.result === 4) {
                        firstAcceptSolution = exportSolutionInfo;
                        break;
                    }
                    else if (firstErrorSolution === undefined){
                        firstErrorSolution = exportSolutionInfo;
                    }
                }
                if (firstAcceptSolution !== undefined) {
                    resultProblemInfoMap[userProblemInfoMapKey]![userProblemInfoMapElementKey] = firstAcceptSolution;
                }
                else if (firstErrorSolution !== undefined) {
                    resultProblemInfoMap[userProblemInfoMapKey]![userProblemInfoMapElementKey] = firstErrorSolution;
                }
            }
        }
        for (let resultProblemInfoMapKey in resultProblemInfoMap) {
            const res = Object.values(resultProblemInfoMap[resultProblemInfoMapKey]!)
            resultSolutionInfoList.push(...res)
        }
        this.enhanceResultString(resultSolutionInfoList)
        return this.convertLastFormatToMustache(resultSolutionInfoList);
    }

    enhanceResultString(exportSolutionInfoList: ExportSolutionInfo[]) {
        exportSolutionInfoList.forEach(e => {
            e.result_string = RESULT_CHINESE_STRING[e.result]
        })
    }
}

export default new SolutionManager();
