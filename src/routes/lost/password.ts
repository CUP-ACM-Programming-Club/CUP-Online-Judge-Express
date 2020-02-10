import express, {Router} from "express";
import LostPasswordManager from "../../manager/user/LostPasswordManager";

const router: Router = express.Router();

router.get("/:user_id", async (req, res) => {
    res.json(await LostPasswordManager.getConfirmQuestion(req));
});

router.post("/", async (req, res) => {
    res.json(await LostPasswordManager.resetPassword(req));
});

export = ["/password", router];
