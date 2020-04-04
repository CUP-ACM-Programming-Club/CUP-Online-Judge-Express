import express from "express";
import UserRegisterManager from "../../manager/user/UserRegisterManager";
const router = express.Router();

router.post("/", async (req, res) => {
    res.json(await UserRegisterManager.initSystemAdminUserRequest(req));
});

export = ["/firstrun", router];
