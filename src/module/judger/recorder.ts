import {getUserIdBySolutionId} from "../user/user";
import SubmissionManager from "../../manager/submission/SubmissionManager";
import Maintainer from "./recorder/Maintainer";
import isNumber from "../util/isNumber";
const query = require("../mysql_query");
const cache_query = require("../mysql_cache");

type RawNumber = string | number;


interface RuntimeInfoPayload {
	runtime_info: string | null | undefined,
	solution_id: number | string
}

interface TestRunInfoPayload {
	test_run_result: string | null | undefined,
	solution_id: number | string
}


interface CompileInfoPayload {
	compile_info: string | null | undefined,
	solution_id: number | string
}


interface SubmissionPayload extends RuntimeInfoPayload, TestRunInfoPayload, CompileInfoPayload {
	user_id: string,
	problem_id: number | string,
	time: RawNumber,
	memory: RawNumber,
	result: RawNumber,
	pass_point: RawNumber,
	state: RawNumber,
	pass_rate: RawNumber,
	judger: string,
	sim: RawNumber | null | undefined,
	sim_s_id: RawNumber | null | undefined
}


async function checkValidSim(simId: any, simSourceId: any) {
	const source = await getUserIdBySolutionId(simSourceId);
	const current = await getUserIdBySolutionId(simId);
	return source[0].user_id !== current[0].user_id;
}

async function isAdministrator(solutionId: string | number) {
	const userId = await getUserIdBySolutionId(solutionId);
	const response = await cache_query(`select rightstr from privilege where user_id = ? and rightstr = 'administrator'`, [userId]);
	return !!(response && response.length && response.length > 0);

}

async function baseSubmissionStore(payload: SubmissionPayload) {
	payload.result = payload.state;
	let {time, memory, result, pass_point, pass_rate, judger, solution_id, sim, sim_s_id} = payload;
	await query("update solution set time = ?, memory = ?, result = ?, pass_point = ?, pass_rate = ?, judger = ? where solution_id = ? and result < 4",
		[time, memory, result, pass_point, pass_rate, judger, solution_id]);
	if (isNumber(sim) && parseInt(<string>sim) > 0 && await checkValidSim(solution_id, sim_s_id) && !(await isAdministrator(solution_id))) {
		await query("insert into sim(s_id,sim_s_id,sim) values(?,?,?) on duplicate key update  sim_s_id=?,sim=?", [solution_id, sim_s_id, sim, sim_s_id, sim]);
	}
}

async function compileErrorStore(payload: CompileInfoPayload) {
	const {compile_info, solution_id} = payload;
	await query("delete from compileinfo where solution_id = ?", [solution_id]);
	await query("insert into compileinfo values(?, ?)  on duplicate key update  error = ?", [solution_id, compile_info, compile_info]);
}


async function storeToRuntimeError(solution_id: any, info: any) {
	await query("delete from runtimeinfo where solution_id = ?", [solution_id]);
	await query("insert into runtimeinfo values(?, ?) on duplicate key update error = ?", [solution_id, info, info]);
}

export async function runtimeErrorStore(payload: RuntimeInfoPayload) {
	const {runtime_info, solution_id} = payload;
	await storeToRuntimeError(solution_id, runtime_info);
}

export async function testRunStore(payload: TestRunInfoPayload) {
	const {test_run_result, solution_id} = payload;
	await storeToRuntimeError(solution_id, test_run_result);
}

export async function storeNormalSubmission(payload: SubmissionPayload) {
	await baseSubmissionStore(payload);
	const runtime_info = payload.runtime_info;
	const solution_id = payload.solution_id;
	await runtimeErrorStore({runtime_info, solution_id});
}

export async function storeCompileErrorSubmission(payload: SubmissionPayload) {
	await baseSubmissionStore(payload);
	const compile_info = payload.compile_info;
	const solution_id  = payload.solution_id;
	await compileErrorStore({compile_info, solution_id});
}

export async function storeRuntimeErrorSubmission(payload: SubmissionPayload) {
	await baseSubmissionStore(payload);
	await runtimeErrorStore(payload);
}

export async function storeTestRunSubmission(payload: SubmissionPayload) {
	await baseSubmissionStore(payload);
	await testRunStore(payload);
}

export async function storeSubmission(payload: SubmissionPayload) {
	console.log("storeSubmission: ", payload);
	if (payload.state === 11) {
		await storeCompileErrorSubmission(payload);
	} else if (payload.state === 10) {
		await storeRuntimeErrorSubmission(payload);
	} else if (payload.state === 13) {
		await storeTestRunSubmission(payload);
	} else {
		await storeNormalSubmission(payload);
	}
	if (payload.state >= 4) {
		await Maintainer.maintainUserInfo(payload.user_id);
		await Maintainer.maintainProblem((await SubmissionManager.getSolutionInfo(<number>payload.solution_id)).problem_id);
	}
	if (payload.runtime_info) {
		delete payload.runtime_info;
	}
}
