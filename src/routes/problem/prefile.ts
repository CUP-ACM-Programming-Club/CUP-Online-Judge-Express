import express from "express";
import PrependAppendManager from "../../manager/problem/PrependAppendManager";

const adminMiddleware = require("../../middleware/admin");
const router = express.Router();

router.get("/prepend/:problem_id", async (req, res) => {
    res.json(await PrependAppendManager.getPrependCode(req.params.problem_id));
});

router.get("/append/:problem_id", async (req, res) => {
    res.json(await PrependAppendManager.getAppendCode(req.params.problem_id));
});

router.post("/prepend", adminMiddleware, async (req, res) => {
    res.json(await PrependAppendManager.setPrependCode(req.body));
});

router.post("/append", adminMiddleware, async (req, res) => {
    res.json(await PrependAppendManager.setAppendCode(req.body));
});

module.exports = ["/prefile", router];
