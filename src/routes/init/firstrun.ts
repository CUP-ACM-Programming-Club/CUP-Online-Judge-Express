import express from "express";
import UserRegisterManager from "../../manager/user/UserRegisterManager";
import {ok} from "../../module/constants/state";
import InitManager from "../../manager/init/InitManager";
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
