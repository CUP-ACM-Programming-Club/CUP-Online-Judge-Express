import express from "express";
import {ok} from "../../../../domain/constants/state";
import InitController from "../../controllers/InitController";
const router = express.Router();

router.post("/admin", async (req, res) => {
    res.json(await InitController.initSystemAdminUser(req));
});

router.post("/config", async (req, res) => {
    res.json(await InitController.initConfigFile(req));
});

router.get("/", async (req, res) => {
    res.json(ok.okMaker(global.config));
});

export = ["/firstrun", router];
