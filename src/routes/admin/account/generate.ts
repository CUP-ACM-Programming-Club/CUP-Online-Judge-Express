import express from "express";
import ContestAccountGenerateManager from "../../../manager/user/ContestAccountGenerateManager";
const router = express.Router();

router.post("/batch", async (req, res) => {
    res.json(await ContestAccountGenerateManager.batchGenerateAccountByRequest(req));
});

export = ["/generate", router];
