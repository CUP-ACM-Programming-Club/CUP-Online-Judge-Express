import express from "express";
import UserRegisterManager from "../../../../infrastructure/persistence/user/UserRegisterManager";
import {ok} from "../../../../domain/constants/state";
import InitManager from "../../../../main/init/manager/InitManager";
const router = express.Router();

router.post("/admin", async (req, res) => {
    res.json(await UserRegisterManager.initSystemAdminUserRequest(req));
});

router.post("/config", async (req, res) => {
    res.json(await InitManager.initConfigFile(req));
});

router.get("/", async (req, res) => {
    res.json(ok.okMaker(global.config));
});

export = ["/firstrun", router];
