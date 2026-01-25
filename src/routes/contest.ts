/* eslint-disable no-console */
import AutoRouterUse from "../module/common/AutoRouterUse";
const router = AutoRouterUse.resolveDirRouter(__dirname, "./contest");
import auth from "../middleware/auth";
import ContestService from "../service/ContestService";
import HttpError from "../module/util/HttpError";

router.get("/general/:cid", async (req: any, res: any) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	try {
		if (~cid) {
			// Original code called 'check' here which validates access.
			// ContestService.getContestGeneralDetail basically gets public info.
			// But wait, the original code had: if (~cid && await check(req, res, cid))
			// So General Info is protected!
			// I should use checkContestAccess in getContestGeneralDetail or check it here.
			await ContestService.checkContestAccess(req, cid);
			const data = await ContestService.getContestGeneralDetail(cid);
			res.json({
				status: "OK",
				data: data
			});
		} else {
			res.json(require("../module/constants/state").error.invalidParams);
		}
	} catch (e) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
		} else {
			console.log(e);
			res.json(require("../module/constants/state").error.internalError);
		}
	}
});

router.get("/problem/:cid", async (req: any, res: any) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	try {
		if (~cid) {
			const data = await ContestService.getContestProblemList(req, cid);
			res.json(data);
		} else {
			res.json(require("../module/constants/state").error.invalidParams);
		}
	} catch (e) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
		} else {
			console.log(e);
			res.json(require("../module/constants/state").error.database);
		}
	}
});

router.get("/list", async (req: any, res: any) => {
	res.json(await ContestService.getContestList(req));
});

router.get("/v2/list", async (req: any, res: any) => {
	res.json(await ContestService.getContestListAsObject(req));
});

router.get("/list/all", async (req: any, res: any) => {
	res.json(await ContestService.getAllContestList());
});

router.get("/total", async (req: any, res: any) => {
	res.json(await ContestService.getTotalNumber(req));
});

router.get("/statistics/:cid", async (req: any, res: any) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	try {
		const data = await ContestService.getContestStatistics(req, cid);
		res.json(data);
	} catch (e) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
		} else {
			console.log(e);
			res.json(require("../module/constants/state").error.invalidParams);
		}
	}
});

router.post("/password/:cid", async (req: any, res: any) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	try {
		const result = await ContestService.checkPassword(req, cid, req.body.password);
		res.json(result);
	} catch (e) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
		} else {
			console.log(e);
			res.json(require("../module/constants/state").error.invalidParams);
		}
	}
});

export = ["/contest", auth, router];
