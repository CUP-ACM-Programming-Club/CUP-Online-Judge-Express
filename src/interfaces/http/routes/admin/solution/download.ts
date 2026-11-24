import express from "express";
import SolutionController from "../../../controllers/SolutionController";
const router = express.Router();

router.get("/contest/:contestId", async (req, res) => {
    res.status(200)
        .attachment(`Contest ${req.params.contestId}.txt`)
        .send(await SolutionController.getSolutionExportInfoByContestId(req));
});

router.get("/contest/:contestId/lastAck", async (req, res) => {
    res.status(200)
        .attachment(`Contest ${req.params.contestId}.txt`)
        .send(await SolutionController.getLastSolutionExportInfoByContestId(req))
})

export = ["/download", router];
