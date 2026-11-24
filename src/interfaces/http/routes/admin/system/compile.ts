import express from "express";
import CompilerController from "../../../controllers/CompilerController";
const router = express.Router();

router.get("/compile_arguments", async (req, res) => {
    res.json(await CompilerController.getCompileArgumentsByRequest(req));
});

router.post("/compile_arguments", async (req, res) => {
    res.json(await CompilerController.updateCompileArgumentsByRequest(req));
});

export = ["/compile", router];
