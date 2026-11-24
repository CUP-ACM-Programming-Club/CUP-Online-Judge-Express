import express from "express";
import ProblemPrefileController from "../../controllers/ProblemPrefileController";

const adminMiddleware = require("../../middleware/admin");
const router = express.Router();

router.get("/prepend/:problem_id", async (req, res) => {
    res.json(await ProblemPrefileController.getPrependCode(req.params.problem_id));
});

router.get("/append/:problem_id", async (req, res) => {
    res.json(await ProblemPrefileController.getAppendCode(req.params.problem_id));
});

router.post("/prepend", adminMiddleware, async (req, res) => {
    res.json(await ProblemPrefileController.setPrependCode(req.body));
});

router.post("/append", adminMiddleware, async (req, res) => {
    res.json(await ProblemPrefileController.setAppendCode(req.body));
});

module.exports = ["/prefile", router];
