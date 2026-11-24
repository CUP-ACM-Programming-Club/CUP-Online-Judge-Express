import express from "express";
const router = express.Router();
import admin_auth from "../../middleware/admin";

import { rejudgeRequestHandler as routerFunc } from "../../controllers/RejudgeController";

router.post("/", async (req, res) => {
	await routerFunc(req, res, 15);
});

export = ["/ban_submission", admin_auth, router];
