import path from "path";
import { problemManageRepository } from "../ports/ProblemManageRepository";
import { problemImportStorage } from "../ports/ProblemImportStorage";
import { problemImageStorage } from "../ports/ProblemImageStorage";
import { problemInfoStore } from "../ports/ProblemInfoStore";
const jschardet = require("jschardet");
const iconv = require("iconv-lite");
const stripBom = require("strip-bom");

interface ProblemFiles {
    input: any[];
    output: any[];
    prepend: any[];
    append: any[];
    solution: any[];
    special_judge: any[];
}

interface ProblemInfo {
    title: string;
    description: string;
    input: string;
    output: string;
    sample_input: string;
    sample_output: string;
    spj: number;
    hint: string;
    source: string;
    label: string | string[];
    time: number;
    memory: number;
    defunct: string;
    special_judge?: any;
}

class ProblemManageService {

    // Helper: Convert Language
    private convertLanguage(language_name: string) {
        const language_file_name: any = {
            ".c": [0, 13, 21],
            ".cpp": [1, 14, 19, 20],
            ".cc": [1, 14, 19, 20],
            ".java": [3, 23, 24, 27],
            ".py": [17, 18],
            ".js": [16],
            ".lua": [15]
        };
        for (let i in language_file_name) {
            if (path.extname(language_name) === i) {
                return language_file_name[i];
            }
        }
        return [19];
    }

    // Helper: Base64 to String with encoding detection
    private base64ToString(base64: string) {
        let data: any = Buffer.from(base64, "base64");
        if (jschardet.detect(data).encoding === "GB2312") {
            data = iconv.decode(data, "gb2312");
        }
        return stripBom(data.toString());
    }

    async createProblem(req: any, problemId: number | undefined, problemInfo: ProblemInfo) {
        const save_problem = Object.assign({
            title: "",
            description: "",
            input: "",
            output: "",
            sample_input: "",
            sample_output: "",
            spj: 0,
            hint: "",
            source: "",
            label: "",
            in_date: "",
            time: 0,
            memory: 0,
            defunct: "N",
            accepted: 0,
            submit: 0,
            solved: 0
        }, problemInfo);

        const sqlValues = [save_problem.title, save_problem.description, save_problem.input,
        save_problem.output, save_problem.sample_input, save_problem.sample_output,
        Number(Boolean(save_problem.special_judge && save_problem.special_judge.length > 0)),
        save_problem.hint, save_problem.source, Array.isArray(save_problem.label) ? save_problem.label.join(" ") : save_problem.label, save_problem.time,
        save_problem.memory, save_problem.defunct, 0, 0, 0];

        if (problemId) {
            await problemManageRepository.insertProblem(problemId, sqlValues);
        } else {
            const result = await problemManageRepository.insertProblem(undefined, sqlValues);
            problemId = result.insertId;
        }

        await problemManageRepository.deleteProblemPrivilege(problemId);
        await problemManageRepository.insertProblemPrivilege(req.session.user_id, problemId);
        req.session.problem_maker[`p${problemId}`] = true;

        return problemId;
    }

    private async writeFiles(savePath: string, files: any[]) {
        for (let i of files) {
            if (!i || !i.name || !i.content) {
                continue;
            }
            // names come from the uploaded archive: keep only the file name so nothing is written outside savePath
            const name = path.basename(String(i.name));
            if (!name || name === "." || name === "..") {
                continue;
            }
            const data = this.base64ToString(i.content);
            await problemImportStorage.writeDataFile(savePath, name, data);
        }
    }

    private async submitStandardSolution(req: any, pid: number, files: any[], prepend: any[] = [], append: any[] = []) {
        for (let i of files) {
            const content = Buffer.from(i.content, "base64").toString();
            const language = JSON.stringify(this.convertLanguage(i.name));
            let prepend_code = prepend.find((el) => JSON.stringify(this.convertLanguage(el.name)) === language) || "";
            let append_code = append.find((el) => JSON.stringify(this.convertLanguage(el.name)) === language) || "";
            if (prepend_code !== "") {
                prepend_code = this.base64ToString(prepend_code.content);
            }
            if (append_code !== "") {
                append_code = this.base64ToString(append_code.content);
            }
            const rows = await problemManageRepository.insertStandardSolution(pid, this.convertLanguage(i.name)[0], req.session.user_id, content.length);
            const solution_id = rows.insertId;
            problemManageRepository.insertSourceCode(solution_id, prepend_code + content + append_code);
            problemManageRepository.insertSourceCodeUser(solution_id, content);
        }
    }

    async writeProblemData(req: any, pid: number, data: any) {
        const inputFiles = data.input_files;
        const outputFiles = data.output_files;
        const prependFiles = data.prepend_files || [];
        const appendFiles = data.append_files || [];
        const special_judge = [data.special_judge];
        const solutionFiles = data.solution;

        const save_path = await problemImportStorage.resetDataDir(pid);

        await this.writeFiles(save_path, inputFiles);
        await this.writeFiles(save_path, outputFiles);

        await this.writeFiles(save_path, special_judge);

        // Prefile handling
        for (let i of prependFiles) {
            const languageSet = this.convertLanguage(i.name);
            for (let lang of languageSet) {
                problemManageRepository.insertPrefile(pid, 1, this.base64ToString(i.content), lang);
            }
        }
        for (let i of appendFiles) {
            const languageSet = this.convertLanguage(i.name);
            for (let lang of languageSet) {
                problemManageRepository.insertPrefile(pid, 0, this.base64ToString(i.content), lang);
            }
        }

        await problemImportStorage.chownDataDir(save_path);
        await this.submitStandardSolution(req, pid, solutionFiles, prependFiles, appendFiles);
    }

    async getMaxProblemId() {
        const _max_pid = await problemManageRepository.findMaxProblemIdRows();
        return parseInt(_max_pid[0].max_id);
    }

    async importProblemFromRPK(req: any, filePath: string, startPid?: number) {
        const unzip_data = await problemImportStorage.readRpk(filePath);
        const problems = JSON.parse(unzip_data);

        let max_pid;
        if (startPid) {
            max_pid = startPid - 1; // Logic adjust: loop uses max_pid + i + 1. So if startPid=1000, max_pid=999.
        } else {
            const _max_pid = await problemManageRepository.findMaxProblemIdRows();
            max_pid = parseInt(_max_pid[0].max_id);
        }

        let problem_list = [];
        for (let i = 0; i < problems.length; ++i) {
            const currentPid = max_pid + i + 1;
            await this.createProblem(req, currentPid, problems[i]);
            await this.writeProblemData(req, currentPid, problems[i]);
            problem_list.push({
                problem_id: currentPid,
                title: problems[i].title
            });
        }
        return problem_list;
        return problem_list;
    }

    // Image Handling Helper (Ported from routes)
    private async storePhotoToDir(problem_id: any, key: any, data: any, type: any) {
        await problemImageStorage.saveImage(problem_id, type, key, data);
    }

    private async storePhotoBase(problem_id: any, name: any, iterableData: any) {
        const tasks = [];
        console.log("storePhotoBase called for:", name);
        for (let i in iterableData) {
            console.log("Processing image:", i);
            tasks.push(this.storePhotoToDir(problem_id, i, iterableData[i], name));
        }
        await Promise.all(tasks);
    }

    private async storePhoto(problem_id: any, photo: any = { description: {}, input: {}, output: {} }) {
        const tasks = [];
        for (let i in photo) {
            tasks.push(this.storePhotoBase(problem_id, i, photo[i]));
        }
        await Promise.all(tasks);
    }

    async updateProblem(req: any, problemId: number, source: string, problemData: any) {
        let local = false;
        if (source.length <= 2 || source === "local") {
            local = true;
        }

        const json = Object.assign({
            title: "",
            time: 0,
            memory: 0,
            description: "",
            input: "",
            output: "",
            sampleinput: "",
            sampleoutput: "",
            label: "",
            hint: "",
            spj: 0,
            imageData: {}
        }, problemData);

        // Debug Log
        console.log("updateProblem called with:", JSON.stringify(problemData));
        console.log("Merged json.imageData:", JSON.stringify(json.imageData));

        await this.storePhoto(problemId, json.imageData);

        await problemManageRepository.updateProblem(local, problemId, source, json);

        // Cache Invalidation
        const ProblemSetCachePool = require("../problemset/ProblemSetCachePool");

        problemInfoStore.removeCache(problemId);
        ProblemSetCachePool.removeAll();
    }
}

export default new ProblemManageService();
