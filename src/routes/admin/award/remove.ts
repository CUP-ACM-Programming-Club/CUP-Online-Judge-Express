import express from "express";
import AwardManager from "../../../manager/award/AwardManager";
const router = express.Router();

router.post("/:award_id", async (req, res) => {
    res.json(await AwardManager.deleteAwardByAwardIdRequest(req));
});

export = ["/remove", router];
