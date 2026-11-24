import express from "express";
import ContestAccountGenerateController from "../../../controllers/ContestAccountGenerateController";
const router = express.Router();

router.post("/batch", async (req, res) => {
    res.json(await ContestAccountGenerateController.batchGenerateAccount(req));
});

export = ["/generate", router];
