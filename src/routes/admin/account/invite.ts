import express, {Router} from "express";
import InviteManager from "../../../manager/user/InviteManager";

const router: Router = express.Router();

router.get("/all", async (req, res) => {
    res.json(await InviteManager.getInviteCodeByRequest(req));
});

router.post("/add", async (req, res) => {
    res.json(await InviteManager.addInviteCodeByRequest(req));
});

router.get("/", async (req, res) => {
    res.json(await InviteManager.getAllInviteCode());
});

router.post("/expire", async (req, res) => {
    res.json(await InviteManager.expireInviteCodeByRequest(req));
})

export = ["/invite", router];
