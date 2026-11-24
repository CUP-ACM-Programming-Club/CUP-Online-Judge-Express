import express from "express";
import LoginLogController from "../../../controllers/LoginLogController";
const router = express.Router();

router.get("/latest", async (req, res) => {
    res.json(await LoginLogController.getLatestLoginLog(req));
});

router.get("/user/:userId", async (req, res) => {
    res.json(await LoginLogController.getUserLoginLog(req));
});


export = ["/login", router];
