import SolveMapController from "../../../controllers/SolveMapController";
import express from "express";
const router = express.Router();
const interceptorMiddleware = require("../../../interceptor/SolveMapInterceptor");

router.get("/user", async (req: any, res: any) => {
	res.json(await SolveMapController.getUserList());
});

router.get("/aclist", async (req: any, res: any) => {
	res.json(await SolveMapController.getTotalACList());
});

router.get("/aclist/:user_id", async (req: any, res: any) => {
	res.json(await SolveMapController.getUserACList(req.params.user_id));
});

router.get("/:problem_id", async (req: any, res: any) => {
	res.json(await SolveMapController.getSolveMap(req.params.problem_id));
});

router.get("/", async (req: any, res: any) => {
	res.json(await SolveMapController.getSolveMap());
});

module.exports = ["/solve_map", interceptorMiddleware, router];
