import express from "express";
import AwardController from "../../../controllers/AwardController";
const router = express.Router();

router.get("/:award_id", async (req, res) => {
    res.json(await AwardController.get(req));
})

export = ["/get", router];
