import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {Request} from "express";
import {ok} from "../../module/constants/state";
const query = require("../../module/mysql_cache");
export interface IProblemInfo {
    title: string,
    description: string,
    input: string,
    output: string,
    sample_input: string,
    sample_output: string,
    spj: number,
    hint: string
    source: string,
    label: string[] | string,
    in_date: number | string,
    time: number,
    memory: number,
    defunct: string,
    accepted: number,
    submit: number,
    solved: number
}
const baseProblemInfo: IProblemInfo = {
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
};
export class ProblemManager {
    @ErrorHandlerFactory(ok.okMaker)
    async addProblem(req: Request, problemInfo?: IProblemInfo) {
        const save_problem = Object.assign(baseProblemInfo, problemInfo);
        const result = await query(`INSERT INTO problem (title,description,input,output,
		sample_input,sample_output,spj,hint,source,label,in_date,time_limit,memory_limit,
		defunct,accepted,submit,solved)
		VALUES(?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?)
		`, [save_problem.title, save_problem.description, save_problem.input,
            save_problem.output, save_problem.sample_input, save_problem.sample_output,
            Number(Boolean(save_problem.spj)),
            save_problem.hint, save_problem.source, save_problem.label.length > 0 ? (save_problem.label as string[]).join(" ") : "", save_problem.time,
            save_problem.memory, save_problem.defunct, 0, 0, 0]);
        const problem_id = result.insertId as number;
        await query("DELETE FROM privilege where rightstr = ?", [`p${problem_id}`]);
        await query("INSERT INTO privilege (user_id,rightstr,defunct) values(?,?,?)", [req.session!.user_id, `p${problem_id}`, "N"]);
        req.session!.problem_maker[`p${problem_id}`] = true;
        return problem_id;
    }
}

export default new ProblemManager();
