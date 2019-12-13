import SolveMapManager from "../../../manager/SolveMap/SolveMapManager";
import express from "express";
const router = express.Router();
const interceptorMiddleware = require("../../../module/status/problem/SolveMapInterceptor");

router.get("/user", async (req, res) => {
	res.json(await SolveMapManager.getUserListForRouter());
});

router.get("/aclist", async (req, res) => {
	res.json(await SolveMapManager.getTotalACList());
});

router.get("/aclist/:user_id", async (req, res) => {
	res.json(await SolveMapManager.getUserACList(req.params.user_id));
});

router.get("/:problem_id", async (req, res) => {
	res.json(await SolveMapManager.getSolveMap(req.params.problem_id));
});

router.get("/", async (req, res) => {
	res.json(await SolveMapManager.getSolveMap());
});

module.exports = ["/solve_map", interceptorMiddleware ,router];
