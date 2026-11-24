import express from "express";
import ContestSetManager from "../../../../../infrastructure/persistence/contestset/ContestSetManager";
const router = express.Router();

router.get("/:contestSetId", async (req, res) => {
    res.json(await ContestSetManager.getContestSetForAdministratorByContestSetIdByRequest(req));
})

export =["/", router];
