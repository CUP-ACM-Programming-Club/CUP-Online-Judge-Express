import express from "express";
import AwardManager from "../../../manager/award/AwardManager";
const router = express.Router();

router.get("/:award_id", async (req, res) => {
    res.json(await AwardManager.getAwardByAwardIdRequest(req));
})

export = ["/get", router];
