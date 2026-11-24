import express from "express";
import ContestSetController from "../../../controllers/ContestSetController";
const router = express.Router();

router.get("/:contestSetId", async (req, res) => {
    res.json(await ContestSetController.getContestSetForAdministrator(req));
})

export =["/", router];
