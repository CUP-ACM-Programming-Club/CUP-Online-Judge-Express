
import { Request } from "express";
import dayjs from "dayjs";
import { error, ok } from "../../domain/constants/state";
import const_variable = require("../../domain/constants/const_name");
import { canBrowseSource, isAdmin, isContestAssistant } from "../../domain/policy/predicates";
import { problemRepository } from "../ports/ProblemRepository";
import { problemInfoStore } from "../ports/ProblemInfoStore";
import { problemResultCache as cache } from "../ports/ProblemResultCache";
import { problemSourcePrivilege } from "../ports/ProblemSourcePrivilege";
const cheerio = require("cheerio");

interface ProblemQueryOptions {
    id: number;
    source: string;
    sid?: number;
    raw?: boolean;
    cid?: number;
    pid?: number;
    tid?: number;
    after_contest?: boolean;
    uploader?: string;
    prepend?: any;
    append?: any;
    sql?: string;
    langmask?: number;
    solution_id?: number;
}

class ProblemService {

    // --- Helper Methods ---

    judgeValidNumber(num: any): any {
        if (Array.isArray(num)) {
            let returnArr = [];
            for (let i of num) {
                returnArr.push(this._judgeValidNumber(i));
            }
            return returnArr;
        } else {
            return this._judgeValidNumber(num);
        }
    }

    private _judgeValidNumber(num: any) {
        if (isNaN(num)) {
            return -1;
        } else {
            return parseInt(num);
        }
    }

    checkEmpty(str: any) {
        if (str === "" || str === null) {
            return null;
        }
        return str;
    }

    async checkUploader(problem_id: any) {
        try {
            const _uploader = await problemRepository.findUploaderRows(problem_id);
            if (_uploader && _uploader.length > 0) {
                return _uploader[0].user_id;
            } else {
                return "Administrator";
            }
        } catch (e) {
            console.log(e);
            return "Administrator";
        }
    }

    checkPrivilege(req: Request) {
        return canBrowseSource(req);
    }

    async checkProblemAvailable(problem_id: any) {
        const problemInfo = await problemInfoStore.find(problem_id);
        const data = problemInfo ? problemInfo.get() : null;
        return !(!data || data.defunct === "Y");
    }

    async checkProblemInContest(problem_id: any) {
        const data = await problemRepository.findRunningContestProblemRows(problem_id);
        return !!(data && data.length && data.length > 0);
    }

    prependAppendHandler(dataArray: any, opt: any) {
        let new_langmask = 0;
        for (let i of dataArray) {
            if (parseInt(i.prepend) === 1) {
                if (!opt.prepend) {
                    opt.prepend = {};
                }
                opt.prepend[parseInt(i.type)] = i.code;
            } else {
                if (!opt.append) {
                    opt.append = {};
                }
                opt.append[parseInt(i.type)] = i.code;
            }
            new_langmask |= (2 ** parseInt(i.type));
        }
        if (new_langmask) {
            opt.langmask = ~new_langmask;
        }
    }

    // --- Core Methods ---

    async getProblem(req: Request, opt: ProblemQueryOptions) {
        const copyVal: any = {};
        this.prependAppendHandler(await problemRepository.findPrefiles(opt.id), opt);
        let rows;

        if (isAdmin(req)) {
            if (opt.source.length === 0) {
                rows = await problemRepository.findLocalProblemWithCreator(opt.id);
            } else {
                rows = await problemRepository.findVjudgeProblem(opt.id, opt.source);
            }
        } else {
            if (opt.source.length === 0) {
                rows = await problemRepository.findLocalProblem(opt.id);
            } else {
                rows = await problemRepository.findPublicVjudgeProblem(opt.id, opt.source);
            }
        }

        return await this.problemCallback(rows, req, opt, copyVal);
    }

    private async problemCallback(rows: any, req: Request, opt: ProblemQueryOptions, copyVal: any = {}) {
        let packed_problem: any = {};
        if (rows.length !== 0) {
            packed_problem = Object.assign({}, rows[0]);
            packed_problem.language_name = (const_variable.language_name as any)[opt.source.toLowerCase() || "local"];
            packed_problem.language_template = (const_variable.language_template as any)[opt.source.toLowerCase() || "local"];
            packed_problem.prepend = opt.prepend;
            packed_problem.append = opt.append;
            packed_problem.uploader = opt.uploader;
            packed_problem.langmask = opt.langmask || const_variable.langmask;

            if (!opt.after_contest) {
                packed_problem.source = "";
            }
            if (opt.solution_id && ~opt.solution_id) {
                const browse_privilege = await problemSourcePrivilege.checkPrivilege(req.session!, opt.solution_id);
                const resolve = await problemRepository.findUserSourceCode(opt.solution_id, req.session!.user_id, browse_privilege);

                const source_code = resolve ? resolve[0] ? resolve[0].source : "" : "";
                const source: any = { source_code };
                if (source_code.length > 0) {
                    const data = await problemRepository.findSolutionLanguage(opt.solution_id);
                    source.language = data[0].language;
                }
                Object.assign(copyVal, { source: source });
                return Object.assign({
                    problem: packed_problem,
                    source: source,
                    isadmin: isAdmin(req) || !!(opt.cid && await isContestAssistant(opt.cid!, req.session!.user_id)),
                    browse_code: req.session!.source_browser,
                    editor: req.session!.editor || false
                }, copyVal);
            } else {
                return Object.assign({
                    problem: packed_problem,
                    source: "",
                    isadmin: isAdmin(req) || !!(opt.cid && await isContestAssistant(opt.cid!, req.session!.user_id)),
                    browse_code: req.session!.source_browser,
                    editor: req.session!.editor || false
                }, copyVal);
            }
        } else {
            throw error.errorMaker("problem not found or not a public problem");
        }
    }

    async searchProblems(val: string, isAdmin: boolean, isDropdown: boolean = false) {
        const cacheKey = `/module/search/${isDropdown ? "dropdown/" : ""}` + isAdmin + val;
        const _res = cache.get(cacheKey);
        if (_res === undefined) {
            const queryVal = `%${val}%`;
            const rows: any = await problemRepository.searchProblems(queryVal, isAdmin);

            if (isDropdown) {
                // Dropdown mode returns raw rows (or we can process it here if needed, but the controller does post-processing)
                // The original code returned 'rows' directly for promisify=true (dropdown)
                return rows;
            } else {
                // Standard mode returns { items: [...] } with processed source
                for (let i in rows) {
                    if (Object.prototype.hasOwnProperty.call(rows, i)) {
                        rows[i]["url"] = "/newsubmitpage.php?id=" + rows[i]["problem_id"];// deprecated
                        rows[i].source = cheerio.load(rows[i].source).text();
                    }
                }
                const result = {
                    items: rows
                };
                cache.set(cacheKey, result, 24 * 60 * 60);
                return result;
            }
        }
        return _res;
    }
    async maintainLabels(vjudge: string) {
        try {
            const rows: any = await problemRepository.findAllLabels(vjudge);
            let all_label: any[] = [];
            for (let i of rows) {
                if (typeof i.label === "string" && i.label.length > 0) {
                    for (let j of i.label.split(" ")) {
                        all_label.push(j);
                    }
                }
            }
            const data = [...new Set(all_label)];
            await Promise.all(data.map(i => problemRepository.insertLabelIfAbsent(vjudge, i)));
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async getLabels(vjudge: string) {
        const rows: any = await problemRepository.findLabelList(vjudge);
        return {
            status: "OK",
            data: rows.map((val: any) => val.label_name)
        };
    }

    async checkProblemContestStatus(id: any) {
        const _end_time = await problemRepository.findContestEndTimesOfProblem(id);
        return (_end_time.length > 0 && dayjs().isBefore(dayjs(_end_time[0].t * 1000)));
    }

    async getSourceCode(req: Request, id: number, sid: number, source: string, vjudge: boolean = false) {
        const prefix = vjudge ? "vjudge_" : "";
        const rows2 = await problemRepository.findSourceCodeWithOwner(sid, prefix);
        if (!rows2 || rows2.length === 0) {
            throw error.errorMaker("Solution not found");
        }
        const user_id = rows2[0].user_id;
        if (!isAdmin(req) && user_id !== req.session!.user_id) {
            throw error.noprivilege;
        } else {
            // Need to fetch problem info for `code` property???
            // Original logic:
            // if (source.length === 0) {
            //     obj = (await ProblemInfoManager.newInstance().setProblemId(id).find()).get()
            // } ...
            // And then obj.code = rows2[0].source;
            // The object `obj` passed to getSourceCode seems to be the PROBLEM object?
            // Wait, the original route logic:
            // await getSourceCode(req, res, (await ProblemInfoManager...find()).get(), { id, sid, source })
            // It modifies the problem object. 
            // Let's simplified this. We just return the code and problem basic info?
            // The route says: `res.json(obj)` where obj is properties of `getSourceCode` result.
            // Oh, checking original route:
            // `await getSourceCode(req, res, (await ...).get(), ...)`
            // `obj` is the first argument (problem info). `getSourceCode` attaches `.code` to it.
            // So we should return the problem info + code.

            let problemInfo: any;
            if (!vjudge) {
                problemInfo = (await problemInfoStore.find(id))!.get();
            } else {
                const pj = await problemRepository.findVjudgeProblem(id, source);
                problemInfo = pj[0];
            }

            if (!problemInfo) {
                throw error.errorMaker("Problem not found");
            }

            problemInfo.code = rows2[0].source;
            cache.set("source/id/" + source + id + "/" + sid, problemInfo, 10 * 24 * 60 * 60);
            return problemInfo;
        }
    }

    /** 读取 getSourceCode 留下的缓存；未命中返回 undefined */
    getCachedSourceCode(source: string, id: number, sid: number) {
        return cache.get("source/id/" + source + id + "/" + sid);
    }

    async getVjudgeProblem(id: number, source: string) {
        return await problemRepository.findVjudgeProblem(id, source);
    }
}

export default new ProblemService();
