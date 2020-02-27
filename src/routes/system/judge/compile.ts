import express from "express";
import CompilerManager from "../../../manager/judge/CompilerManager";
const router = express.Router();

router.get("/", async (req, res) => {
    res.json(await CompilerManager.getCompileArgumentsByRequest(req));
});

export = ["/compile", router];
