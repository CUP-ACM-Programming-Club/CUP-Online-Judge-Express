import express from "express";
import AwardController from "../../../controllers/AwardController";
const router = express.Router();

router.post("/:award_id", async (req, res) => {
    res.json(await AwardController.update(req));
});

export = ["/edit", router];
