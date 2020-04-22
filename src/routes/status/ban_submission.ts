import express from "express";
const router = express.Router();
import admin_auth from "../../middleware/admin";

import { router as routerFunc} from "../../module/status/update_solution_result";

router.post("/", async (req, res) => {
	await routerFunc(req, res, 15);
});

export = ["/ban_submission", admin_auth, router];
