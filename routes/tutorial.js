/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const cache_query = require("../module/mysql_cache");
const {checkCaptcha} = require("../module/captcha_checker");
const [error, ok] = require("../module/const_var");
const const_variable = require("../module/const_name");
const checkSourceId = (req) => {
	const source = req.params.source;
	let id = req.params.id;
	if (isNaN(id)) {
		return false;
	}
	return {
		source: source.toUpperCase(),
		id
	};
};

const checkSolutionId = async (solution_id, problem_id, local = true, source = "") => {
	solution_id = parseInt(solution_id);
	if (isNaN(solution_id)) {
		return false;
	}
	else if (local) {
		const _data = await cache_query(`select result,problem_id from solution where 
	    solution_id = ?`, [solution_id]);
		return _data.length > 0 && parseInt(_data[0].result) === 4 && parseInt(problem_id) === parseInt(_data[0].problem_id);
	}
	else {
		const _data = await cache_query(`select result,problem_id,oj_name from vjudge_solution where 
	    solution_id = ?`, [solution_id]);
		return _data.length > 0 && parseInt(_data[0].result) === 4 && parseInt(problem_id) === parseInt(_data[0].problem_id)
            && source === _data[0].oj_name;
	}
};

const checkOwner = async (solution_id, req) => {
	const _data = await cache_query("select user_id from solution where solution_id = ?", [solution_id]);
	if (!_data || _data.length <= 0) {
		console.log("false 1");
		return false;
	}
	const user_id = _data[0].user_id;
	return user_id === req.session.user_id;
};

const checkTutorialOwner = async (tutorial_id, req) => {
	const _data = await cache_query("select user_id from tutorial where tutorial_id = ?", [tutorial_id]);
	if (!_data || _data.length <= 0) {
		console.log("false 1");
		return false;
	}
	const user_id = _data[0].user_id;
	return user_id === req.session.user_id;
};

const getSourceProblemId = async (tutorial_id) => {
	const _data = await cache_query("select source,problem_id from tutorial where tutorial_id = ?", [tutorial_id]);
	if (_data && _data.length > 0) {
		return {
			source: _data[0].source,
			problem_id: _data[0].problem_id
		};
	}
	else {
		throw new Error("wrong tutorial_id");
	}
};

router.get("/:source/:id", async (req, res) => {
	const _sourceId = checkSourceId(req);
	const source = _sourceId.source;
	const id = _sourceId.id;
	let sqlQuery = [];
	sqlQuery.push(cache_query(`select tutorial.*,users.user_id,users.nick,users.avatar,users.solved,users.biography,
	 solution.time,solution.memory,solution.language,solution.result,solution.code_length,solution.in_date,source_code_user.source as code
	from tutorial
left join users on users.user_id = tutorial.user_id
left join solution on solution.solution_id = tutorial.solution_id
left join source_code_user on source_code_user.solution_id = tutorial.solution_id 
where tutorial.source = ? and tutorial.problem_id = ? order by 'like' desc, dislike asc,tutorial.in_date desc`, [source, id]));
	let data = await Promise.all(sqlQuery);
	data = data[0];
	if (data && data.length > 0) {
		for (let i of data) {
			if (i.user_id === req.session.user_id) {
				i.owner = true;
			}
		}
	}
	res.json({
		status: "OK",
		data: data,
		self: req.session.user_id,
		const_variable: {
			judge_color: const_variable.judge_color,
			language_name: const_variable.language_name.local,
			icon_list: const_variable.icon_list,
			result: const_variable.result.cn,
			language_common_name: const_variable.language_name.common
		}
	});
});

router.get("/:tutorial_id", async (req, res) => {
	try {
		let tutorial_id = req.params.tutorial_id;

		if (isNaN(tutorial_id)) {
			res.json(error.invalidParams);
			return;
		}

		const _data = await cache_query("select solution_id,content from tutorial where tutorial_id = ?", [tutorial_id]);
		if (_data && _data.length > 0) {
			res.json({
				status: "OK",
				data: {
					solution_id: _data[0].solution_id,
					content: _data[0].content
				}
			});
		}
		else {
			res.json({
				status: "OK",
				data: {
					solution_id: null,
					content: null
				}
			});
		}
	}
	catch (e) {
		res.json(error.database);
		console.log(e);
	}
});

router.post("/new/:source/:id", async (req, res) => {
	checkCaptcha(req, "tutorial");
	const _sourceId = checkSourceId(req);
	const source = _sourceId.source;
	const id = _sourceId.id;
	const content = req.body.content;
	const solution_id = req.body.solution_id;
	let sqlQuery = [checkSolutionId(solution_id, id, source === "LOCAL", source), checkOwner(solution_id, req)];
	let _data = await Promise.all(sqlQuery);
	if (_data[0] && _data[1]) {
		cache_query(`insert into tutorial(source,problem_id,user_id,solution_id,content)
        values(?,?,?,?,?)`,
		[source, id, req.session.user_id, solution_id, content])
			.then(() => {
				res.json(ok.serverReceived);
			})
			.catch(err => {
				res.json(error.database);
				console.log(err);
			});
	}
	else {
		res.json(error.solutionIdNotValid);
	}
});

router.post("/edit/:tutorial_id", async (req, res) => {
	try {
		checkCaptcha(req, "tutorial");
		let tid = req.params.tutorial_id;
		if (isNaN(tid)) {
			res.json(error.invalidParams);
			return;
		}
		const content = req.body.content;
		const solution_id = req.body.solution_id;
		const sourceProblemId = await getSourceProblemId(tid);
		const {source, problem_id} = sourceProblemId;
		let sqlQuery = [checkSolutionId(solution_id, problem_id, source.toUpperCase() === "LOCAL", source), checkOwner(solution_id, req), checkTutorialOwner(tid, req)];
		const _data = await Promise.all(sqlQuery);
		console.log(sqlQuery);
		if (!_data[0] || !_data[1]){
			res.json(error.solutionIdNotValid);
		}
		else if (!_data[2] && !req.session.isadmin){
			res.json(error.noprivilege);
		}
		else {
			cache_query(`update tutorial set content = ?,
        solution_id = ? where tutorial_id = ?`, [content, solution_id, tid])
				.then(() => {
					res.json(ok.serverReceived);
				})
				.catch(err => {
					res.json(error.database);
					console.log(err);
				});
		}
	}
	catch (e) {
		res.json({
			status: "error",
			statement: e
		});
	}
});

module.exports = ["/tutorial", auth, router];
