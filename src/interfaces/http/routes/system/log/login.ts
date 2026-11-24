import express from "express";
import LoginLogManager from "../../../../../infrastructure/persistence/user/record/LoginLogManager";
const router = express.Router();

router.get("/latest", async (req, res) => {
    res.json(await LoginLogManager.getLatestLoginLogByRequest(req));
});

router.get("/user/:userId", async (req, res) => {
    res.json(await LoginLogManager.getUserLoginLogByRequest(req));
});


export = ["/login", router];
