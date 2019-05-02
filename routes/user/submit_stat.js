const express = require("express");
const cache_query = require("../../module/mysql_cache");
const query = cache_query;
const [error, ok] = require("../../module/const_var");
const router = express.Router();

const generateWhereStatement = function (args) {
	args = args.map(el => {
		return el.join(" ");
	});
	return "where " + args.join(" and ");
};

const generateArguments = function () {
	let args = [];
	if (arguments.length === 1) {
		args.push(["user_id", "=", "?"]);
	} else if (arguments.length === 3) {
		args.push(["user_id", "=", "?"], ["in_date", ">=", "?"], ["in_date", "<=", "?"]);
	}
	return args;
};

async function submitHandler() {
	let args = generateArguments(...arguments);
	const sql = `SELECT users.user_id,
       users.nick,
       users.avatar,
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
      ${generateWhereStatement(args)}) solution
         left join users
                   on users.user_id = solution.user_id
         left join sim
                   on sim.s_id = solution.solution_id
union all
select users.user_id,
       users.nick,
       users.avatar,
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
      where ${generateWhereStatement(args)}) vsol
         left join users on users.user_id = vsol.user_id
ORDER BY user_id, in_date`;
	return await query(sql, [...arguments, ...arguments]);
}

async function lineBreakHandler() {
	let args = generateArguments(arguments);
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
             ${generateWhereStatement(args)})) code_stat
         left join
         (select user_id, solution_id, problem_id from solution ${generateWhereStatement(args)}) user
         on user.solution_id = code_stat.solution_id`;
	return await cache_query(sql, [...arguments, ...arguments]);
}

async function submitStatHandler() {
	let [submitStat, line_break] = await Promise.all([submitHandler(arguments), lineBreakHandler(arguments)]);
	let map = {};
	for(const i of submitStat) {
		map[i.solution_id] = i;
	}
	for(const i of line_break) {
		map[i.solution_id] = Object.assign(map[i.solution_id], i);
	}
	return map;
}

router.get("/:user_id/:start_time/:end_time", async (req, res) => {
	try {
		const {user_id, start_time, end_time} = req.params;
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

router.get("/:user_id", async (req, res) => {
	try {
		const {user_id} = req.params;
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