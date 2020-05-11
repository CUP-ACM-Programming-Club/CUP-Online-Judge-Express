import express from "express";
import UserManager from "../../manager/user/UserManager";
const router = express.Router();

router.get("/:user_id", async (req, res) => {
    res.json(await UserManager.getUserEmailByRequest(req));
});

export = ["/email", router];
