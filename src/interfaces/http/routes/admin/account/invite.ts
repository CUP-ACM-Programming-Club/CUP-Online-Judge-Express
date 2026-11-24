import express, {Router} from "express";
import InviteController from "../../../controllers/InviteController";

const router: Router = express.Router();

router.get("/all", async (req, res) => {
    res.json(await InviteController.getInviteCodePage(req));
});

router.post("/add", async (req, res) => {
    res.json(await InviteController.addInviteCode(req));
});

router.get("/", async (req, res) => {
    res.json(await InviteController.getAllInviteCode());
});

router.post("/expire", async (req, res) => {
    res.json(await InviteController.expireInviteCode(req));
})

export = ["/invite", router];
