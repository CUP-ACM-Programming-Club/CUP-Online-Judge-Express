import express, { Request, Response } from "express";

const router = express.Router();
import SpecialSubjectUseCases from "../../../application/problem/SpecialSubjectUseCases";
const [error] = require("../../../domain/constants/const_var");
import auth from "../middleware/auth";

router.get("/", async (req: Request, res: Response) => {
	try {
		const data = await SpecialSubjectUseCases.listActive();
		res.json({
			status: "OK",
			data
		});
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/:cid", async (req: Request, res: Response) => {
	try {
		// TODO:complete cid API
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

export = ["/specialsubject", auth, router];
