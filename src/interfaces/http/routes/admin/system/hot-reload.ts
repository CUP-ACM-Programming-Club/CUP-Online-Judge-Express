import express from "express";
const router = express.Router();
const { error, ok } = require("../../../../../domain/constants/state");
import { processControl } from "../../../../../application/ports/ProcessControl";

router.get("/", (req: any, res: any) => {
	try {
		processControl.restartNotify();
		res.json(ok.ok);
	}
	catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
});

module.exports = ["/hot-reload", router];
