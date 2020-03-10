import express from "express";
import LogManager from "../../../manager/system/LogManager";
const router = express.Router();

router.get("/out", async (req, res) => {
    res.json(await LogManager.getStdoutLog(parseInt(req.params.line)))
});

router.get("/err", async (req, res) => {
    res.json(await LogManager.getStderrLog(parseInt(req.params.line)))
});

export = ["/log", router];
