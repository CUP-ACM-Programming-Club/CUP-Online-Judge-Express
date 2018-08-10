/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const cache_query = require("../module/mysql_cache");
const {checkCaptcha} = require("../module/captcha_checker");
const [error, ok] = require("../module/const_var");
const checkSourceId = (req) => {
	const source = req.params.source;
	let id = req.params.id;
	if (isNaN(id)) {
		return false;
	}
	return {
		source,
		id
	};
};

const checkSolutionId = async (solution_id, local = true) => {
	solution_id = parseInt(solution_id);
	if (isNaN(solution_id)) {
		return false;
	}
	else if (local) {
		const _data = await cache_query(`select result from solution where 
	    solution_id = ?`, [solution_id]);
		return _data.length > 0 && parseInt(_data[0].result) === 4;
	}
	else {
		const _data = await cache_query(`select result from vjudge_solution where 
	    solution_id = ?`, [solution_id]);
		return _data.length > 0 && parseInt(_data[0].result) === 4;
	}
};

router.get("/:source/:id", async (req, res) => {
	const _sourceId = checkSourceId(req);
	const source = _sourceId.source;
	const id = _sourceId.id;
	let sqlQuery = [];
	sqlQuery.push(cache_query(`select tutorial.*,users.user_id,users.nick,users.avatar,users.solved,users.biography 
	from tutorial
left join users on users.user_id = tutorial.user_id
where source = ? and problem_id = ?`, [source, id]));
	const data = await Promise.all(sqlQuery);
	res.json({
		status: "OK",
		data: data[0],
		self: req.session.user_id
	});
});

router.post("/new/:source/:id", (req, res) => {
	checkCaptcha(req, "tutorial");
	const _sourceId = checkSourceId(req);
	const source = _sourceId.source;
	const id = _sourceId.id;
	const content = req.body.content;
	const solution_id = req.body.content;
	if (checkSolutionId(solution_id)) {
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

router.post("/edit/:source/:id", (req, res) => {
	checkCaptcha(req, "tutorial");
	const _sourceId = checkSourceId(req);
	const source = _sourceId.source;
	const id = _sourceId.id;
	const content = req.body.content;
	const solution_id = req.body.content;
	if (checkSolutionId(solution_id)) {
		cache_query(`update tutorial set content = ?,
        solution_id = ? where source = ? and user_id = ? 
        and problem_id = ?`, [content, solution_id, source,
			req.session.user_id, id])
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

module.exports = ["/tutorial", auth, router];
