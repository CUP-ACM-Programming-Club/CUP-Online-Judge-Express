import express from "express";
const cache_query = require("../../module/mysql_cache");
const query = cache_query;
const [error, ok] = require("../../module/const_var");
const router = express.Router();

const generateWhereStatement = function (args: any) {
	args = args.map((el: any) => {
		return el.join(" ");
	});
	return "where " + args.join(" and ");
};

const generateArguments = function (...args: any[]) {
	let result: any[] = [];
	if (args.length === 1) {
		result.push(["user_id", "=", "?"]);
	} else if (args.length === 3) {
		result.push(["user_id", "=", "?"], ["in_date", ">=", "?"], ["in_date", "<=", "?"]);
	}
	return result;
};

async function submitHandler(...args: any[]) {
	let argList = generateArguments(...args);
	const sql = `SELECT users.user_id,
       users.nick,
       users.avatar,
       users.avatarUrl,
       solution.result,
       solution.num,
       solution.in_date,
       solution.fingerprint,
       solution.fingerprintRaw,
       solution.ip,
       sim.sim,
       solution.code_length,
       solution.solution_id
FROM (select *
      from solution
      ${generateWhereStatement(argList)}) solution
         left join users
                   on users.user_id = solution.user_id
         left join sim
                   on sim.s_id = solution.solution_id
union all
select users.user_id,
       users.nick,
       users.avatar,
       users.avatarUrl,
       vsol.result,
       vsol.num,
       vsol.in_date,
       ''   as fingerprint,
       ''   as fingerprintRaw,
       vsol.ip,
       null as sim,
       vsol.code_length,
       vsol.solution_id
from (select *
      from vjudge_solution
      where ${generateWhereStatement(argList)}) vsol
         left join users on users.user_id = vsol.user_id
ORDER BY user_id, in_date`;
	return await query(sql, [...args, ...args]);
}

async function lineBreakHandler(...args: any[]) {
	let argList = generateArguments(...args);
	const sql = `select code_stat.solution_id,
       code_stat.line,
       user.user_id, user.problem_id
from (select solution_id,
             length(source) - length(replace(source, '\\n', '')) as line,
             source
      from source_code_user
      where solution_id in
            (select solution_id
             from solution
             ${generateWhereStatement(argList)})) code_stat
         left join
         (select user_id, solution_id, problem_id from solution ${generateWhereStatement(argList)}) user
         on user.solution_id = code_stat.solution_id`;
	return await cache_query(sql, [...args, ...args]);
}

async function submitStatHandler(...args: any[]) {
	let [submitStat, line_break] = await Promise.all([submitHandler(...args), lineBreakHandler(...args)]);
	let map: any = {};
	for (const i of submitStat) {
		map[i.solution_id] = i;
	}
	for (const i of line_break) {
		map[i.solution_id] = Object.assign(map[i.solution_id], i);
	}
	return map;
}

router.get("/:user_id/:start_time/:end_time", async (req: any, res: any) => {
	try {
		const { user_id, start_time, end_time } = req.params;
		res.json(ok.okMaker({
			map: await submitStatHandler(user_id, start_time, end_time),
			user: []
		}));
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/:user_id", async (req: any, res: any) => {
	try {
		const { user_id } = req.params;
		res.json(ok.okMaker({
			map: await submitStatHandler(user_id),
			user: []
		}));
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/submit_stat", router];