import express from "express";
import AwardManager from "../../../manager/award/AwardManager";
const router = express.Router();


router.post("/", async (req, res) => {
    res.json(await AwardManager.addAwardByRequest(req));
});

export = ["/add", router];
