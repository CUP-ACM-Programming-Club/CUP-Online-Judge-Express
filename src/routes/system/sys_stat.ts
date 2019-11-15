import express, {Router} from "express";
import {error, ok} from "../../module/constants/state";
import os from "os";
const router: Router = express.Router();

router.get("/loadavg", (req, res) => {
	try {
		res.json(ok.okMaker(os.loadavg()));
	}
	catch {
		res.json(error.internalError);
	}
});

export = ["/stat", router];
