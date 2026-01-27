import Bluebird from "bluebird";
import path from "path";
import zlib from "zlib";
const fs = Bluebird.promisifyAll(require("fs"));
const query = require("../module/mysql_query");
const rimraf = Bluebird.promisify(require("rimraf"));
const jschardet = require("jschardet");
const iconv = require("iconv-lite");
const stripBom = require("strip-bom");
const D2UConverter = require("dos2unix").dos2unix;

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

    private config = global.config;
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

        let result;
        if (problemId) {
            result = await query(`INSERT INTO problem (problem_id,title,description,input,output,
            sample_input,sample_output,spj,hint,source,label,in_date,time_limit,memory_limit,
            defunct,accepted,submit,solved)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?)
            `, [problemId, ...sqlValues]);
        } else {
            result = await query(`INSERT INTO problem (title,description,input,output,
            sample_input,sample_output,spj,hint,source,label,in_date,time_limit,memory_limit,
            defunct,accepted,submit,solved)
            VALUES(?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?)
            `, sqlValues);
            problemId = result.insertId;
        }

        await query("DELETE FROM privilege where rightstr = ?", [`p${problemId}`]);
        await query("INSERT INTO privilege (user_id,rightstr,defunct) values(?,?,?)", [req.session.user_id, `p${problemId}`, "N"]);
        req.session.problem_maker[`p${problemId}`] = true;

        return problemId;
    }

    private async writeFiles(savePath: string, files: any[]) {
        for (let i of files) {
            if (!i || !i.name || !i.content) {
                continue;
            }
            const name = i.name;
            const data = this.base64ToString(i.content);
            await (fs as any).writeFileAsync(path.join(savePath, name), data);
            await (fs as any).chownAsync(path.join(savePath, name), 48, 48);
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
            const rows = await query(`INSERT INTO solution(problem_id,language,user_id,in_date,code_length,ip)
            VALUES(?,?,?,NOW(),?,'127.0.0.1')`, [pid, this.convertLanguage(i.name)[0], req.session.user_id, content.length]);
            const solution_id = rows.insertId;
            query(`INSERT INTO source_code(solution_id,source)VALUES(?,'${prepend_code + content + append_code}')`
                , [solution_id]);
            query(`INSERT INTO source_code_user(solution_id,source)VALUES(?,'${content}')`, [solution_id]);
        }
    }

    async writeProblemData(req: any, pid: number, data: any) {
        const inputFiles = data.input_files;
        const outputFiles = data.output_files;
        const prependFiles = data.prepend_files || [];
        const appendFiles = data.append_files || [];
        const special_judge = [data.special_judge];
        const solutionFiles = data.solution;

        const save_path = path.join("/home/judge/data", pid.toString());

        if (fs.existsSync(save_path)) {
            await (rimraf as any)(save_path);
        }
        await (fs as any).mkdirAsync(save_path, 0o755);

        await this.writeFiles(save_path, inputFiles);
        await this.writeFiles(save_path, outputFiles);

        // DOS2UNIX
        const d2u = new D2UConverter({ glob: { cwd: __dirname } });
        (d2u as any).process([`${save_path}/*`]);

        await this.writeFiles(save_path, special_judge);

        // Prefile handling
        for (let i of prependFiles) {
            const languageSet = this.convertLanguage(i.name);
            for (let lang of languageSet) {
                query("insert into prefile (problem_id,prepend,code,type) VALUES(?,?,?,?)", [pid, 1, this.base64ToString(i.content), lang]);
            }
        }
        for (let i of appendFiles) {
            const languageSet = this.convertLanguage(i.name);
            for (let lang of languageSet) {
                query("insert into prefile (problem_id,prepend,code,type) VALUES(?,?,?,?)", [pid, 0, this.base64ToString(i.content), lang]);
            }
        }

        await (fs as any).chownAsync(save_path, 48, 48);
        await this.submitStandardSolution(req, pid, solutionFiles, prependFiles, appendFiles);
    }

    async getMaxProblemId() {
        const _max_pid = await query("SELECT max(problem_id) as max_id FROM problem");
        return parseInt(_max_pid[0].max_id);
    }

    async importProblemFromRPK(req: any, filePath: string, startPid?: number) {
        const data = await (fs as any).readFileAsync(filePath);
        // @ts-ignore
        const unzip_data = (await Bluebird.promisify(zlib.gunzip as any)(data)).toString();
        const problems = JSON.parse(unzip_data);

        let max_pid;
        if (startPid) {
            max_pid = startPid - 1; // Logic adjust: loop uses max_pid + i + 1. So if startPid=1000, max_pid=999.
        } else {
            const _max_pid = await query("SELECT max(problem_id) as max_id FROM problem");
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
        const website_dir = this.config.website.dir;
        const picPath = path.join(website_dir, "images", problem_id.toString(), type);
        const { mkdirAsync } = require("../module/file/mkdir");
        const base64Img = Bluebird.promisifyAll(require("base64-img"));

        await mkdirAsync(picPath);
        try {
            await (base64Img as any).imgAsync(data, picPath, key);
        } catch (e) {
            console.log(e);
        }
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

        // Import necessary modules locally or at top level if frequently used. 
        // For ProblemService helpers, we can import ProblemService.
        // But ProblemService is creating circular dependency potentially.
        // Let's replicate strict checkEmpty or import it.
        const checkEmpty = (str: any) => {
            if (str === "" || str === null || str === undefined) {
                return 0;
            }
            return str;
        };

        let sql = `update ${local ? "" : "vjudge_"}problem set title = ?,time_limit = ?,
        memory_limit = ?,description = ?,input = ?,output = ?,
        sample_input = ?,sample_output = ?,label = ?${local ? " ,hint = ?, spj = ? " : ""} where problem_id = ?
         ${local ? "" : " and source = ?"}`;

        let sqlArr = [json.title, checkEmpty(json.time), checkEmpty(json.memory), json.description, json.input,
        json.output, json.sampleinput, json.sampleoutput, json.label];

        if (local) {
            sqlArr.push(json.hint, json.spj, problemId);
        } else {
            sqlArr.push(problemId, source);
        }

        await query(sql, sqlArr);

        // Cache Invalidation
        const ProblemInfoManager = require("../module/problem/ProblemInfoManager");
        const ProblemSetCachePool = require("../module/problemset/ProblemSetCachePool");

        ProblemInfoManager.newInstance().setProblemId(problemId).removeCache();
        ProblemSetCachePool.removeAll();
    }
}

export default new ProblemManageService();
