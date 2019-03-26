const express = require("express");
const router = express.Router();
const cache_query = require("../../../module/mysql_cache");
const query = require("../../../module/mysql_query");
const [error, ok] = require("../../../module/const_var");

async function getUserList() {
	return await cache_query("select user_id from users");
}


async function getUserACList(user_id = "") {
	if (user_id === "") {
		return [];
	}
	return await query("select problem_id from solution where user_id = ? and result = 4 order by in_date asc", [user_id]);
}


async function formatAcceptProblemToEdges(problem_list = [], problem_id) {
	let specific_problem = false;
	if (!isNaN(problem_id)) {
		specific_problem = true;
		problem_id = parseInt(problem_id);
	}
	const length = problem_list.length;
	let result = [];
	for (let i = 1; i < length; ++i) {
		let prev_problem_id = parseInt(problem_list[i - 1].problem_id);
		let current_problem_id = parseInt(problem_list[i].problem_id);
		if (prev_problem_id !== current_problem_id) {
		    if(!specific_problem || (specific_problem && (prev_problem_id === problem_id || current_problem_id === problem_id))) {
				result.push({from: problem_list[i - 1].problem_id, to: problem_list[i].problem_id});
			}
		}
	}
	return result;
}

router.get("/user", async (req, res) => {
	try {
		res.json(ok.okMaker(await getUserList()));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/aclist", async (req, res) => {
	try {
		const userList = await getUserList();
		res.json(ok.okMaker(await Promise.all(userList.map(userArray => getUserACList(userArray.user_id)))));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/aclist/:user_id", async (req, res) => {
	try {
		res.json(ok.okMaker(await getUserACList(req.params.user_id)));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

function mergeSameEdges(Edges = []) {
	let map = {};
	Edges.forEach(el => {
		map[el.from + " to " + el.to] = Object.assign({value: 0}, el);
	});
	Edges.forEach(el => {
		++map[el.from + " to " + el.to].value;
	});
	return Object.values(map);
}

async function standardHandler(req, res, problem_id) {
	try {
		const userList = await getUserList();
		const ACLists = await Promise.all(userList.map(user => getUserACList(user.user_id)));
		const formattedEdges = await Promise.all(ACLists.map(list => formatAcceptProblemToEdges(list, problem_id)));
		const edges = [];
		formattedEdges.forEach(edgeList => edges.push(...edgeList));
		const mergeEdges = mergeSameEdges(edges);
		res.json(ok.okMaker(mergeEdges));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
}

router.get("/:problem_id", async (req, res) => {
	await standardHandler(req, res, req.params.problem_id);
});

router.get("/", async (req, res) => {
	await standardHandler(req, res);
});


module.exports = ["/solve_map", router];
