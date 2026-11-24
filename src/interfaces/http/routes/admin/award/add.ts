import express from "express";
import AwardManager from "../../../../../infrastructure/persistence/award/AwardManager";
const router = express.Router();


router.post("/", async (req, res) => {
    res.json(await AwardManager.addAwardByRequest(req));
});

export = ["/add", router];
