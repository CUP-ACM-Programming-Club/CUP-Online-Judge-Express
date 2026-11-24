import express from "express";
import AwardController from "../../../controllers/AwardController";
const router = express.Router();


router.post("/", async (req, res) => {
    res.json(await AwardController.add(req));
});

export = ["/add", router];
