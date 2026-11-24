import express, { Request, Response } from "express";

const router = express.Router();
import auth from "../middleware/auth";
const const_variable = require("../../../domain/constants/const_name");
import SubmissionViewUseCases from "../../../application/submission/SubmissionViewUseCases";

router.get("/", async (req: Request, res: Response) => {
	const data = await SubmissionViewUseCases.getRecentAcmSubmissions(req.query.name ? req.query.name as string : undefined);
	res.json({
		status: "OK",
		admin: (req.session as any)?.isadmin,
		data: data,
		const_data: const_variable.result.cn,
		language_name: const_variable.language_name,
		judge_color: const_variable.judge_color,
		icon_list: const_variable.icon_list
	});
});

export = ["/acmsubmit", auth, router];
