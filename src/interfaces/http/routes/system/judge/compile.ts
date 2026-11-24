import express from "express";
import CompilerController from "../../../controllers/CompilerController";
const router = express.Router();

router.get("/", async (req, res) => {
    res.json(await CompilerController.getCompileArgumentsByRequest(req));
});

export = ["/compile", router];
