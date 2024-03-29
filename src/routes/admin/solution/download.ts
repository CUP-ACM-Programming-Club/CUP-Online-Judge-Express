import express from "express";
import SolutionManager from "../../../manager/submission/SolutionManager";
const router = express.Router();

router.get("/contest/:contestId", async (req, res) => {
    res.status(200)
        .attachment(`Contest ${req.params.contestId}.txt`)
        .send(await SolutionManager.getSolutionExportInfoByContestId(req));
});

router.get("/contest/:contestId/lastAck", async (req, res) => {
    res.status(200)
        .attachment(`Contest ${req.params.contestId}.txt`)
        .send(await SolutionManager.getLastSolutionExportInfoByContestId(req))
})

export = ["/download", router];
