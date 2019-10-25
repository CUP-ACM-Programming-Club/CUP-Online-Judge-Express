const express = require("express");
const router = express.Router();
const {error, ok} = require("../../module/constants/state");
const getProblemInfo = require("../../module/contest/problem");
const ProblemInfoManager = require("../../module/problem/ProblemInfoManager");

function privilegeMiddleware(req, res, next) {
	const contestId = parseInt(req.params.contest_id);
	if (req.session.isadmin || req.session.contest_manager || req.session.contest_maker[`m${contestId}`]) {
		next();
	}
	else {
		res.json(error.noprivilege);
	}
}

router.get("/:contestId", async (req, res) => {
	try {
		const contestId = parseInt(req.params.contestId);
		const contestProblemInfo = await getProblemInfo(contestId, false);
		const problemInfo = (await Promise
			.all(contestProblemInfo
				.map(e => ProblemInfoManager
					.newInstance()
					.setProblemId(e.pid)
					.find()
				)
			)
		).map(e => e.get());
		res.json(ok.okMaker(problemInfo));
	}
	catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
});


module.exports = ["/problem_info", privilegeMiddleware, router];
