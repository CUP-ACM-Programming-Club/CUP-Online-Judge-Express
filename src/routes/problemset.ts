import ProblemSetManager from "../manager/problem/ProblemSetManager";
import express from "express";
const router = express.Router();
const auth = require("../middleware/auth");
const Interceptor = require("../module/problemset/interceptor");


router.get("/:start", async function (req, res) {
	res.json(await ProblemSetManager.getProblem(req, res));
});

router.get("/:start/:search", async function (req, res) {
	res.json(await ProblemSetManager.getProblem(req, res));
});

router.get("/:start/:search/:order", async function (req, res) {
	res.json(await ProblemSetManager.getProblem(req, res));
});

router.get("/:start/:search/:order/:order_rule", async function (req, res) {
	res.json(await ProblemSetManager.getProblem(req, res));
});

export = ["/problemset", auth, Interceptor, router];
