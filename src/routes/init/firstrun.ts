import express from "express";
import UserRegisterManager from "../../manager/user/UserRegisterManager";
import {error, ok} from "../../module/constants/state";
import InitManager from "../../manager/init/InitManager";
const router = express.Router();

router.post("/", async (req, res) => {
    const result = await UserRegisterManager.initSystemAdminUserRequest(req);
    InitManager.setInitFlag(true);
    res.json(result ? ok.ok : error.internalError);
});

export = ["/firstrun", router];
