import express from "express";
import LogManager from "../../../manager/system/LogManager";
const router = express.Router();

router.get("/out", async (req, res) => {
    const params: any = req.params;
    res.json(await LogManager.getStdoutLog(parseInt(params.line as string)))
});

router.get("/err", async (req, res) => {
    const params: any = req.params;
    res.json(await LogManager.getStderrLog(parseInt(params.line as string)))
});

export = ["/log", router];
