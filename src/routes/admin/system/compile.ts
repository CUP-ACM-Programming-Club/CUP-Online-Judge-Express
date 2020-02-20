import express from "express";
import CompilerManager from "../../../manager/judge/CompilerManager";
const router = express.Router();

router.get("/compile_arguments", async (req, res) => {
    res.json(await CompilerManager.getCompileArgumentsByRequest(req));
});

router.post("/compile_arguments", async (req, res) => {

});

export = ["/compile", router];
