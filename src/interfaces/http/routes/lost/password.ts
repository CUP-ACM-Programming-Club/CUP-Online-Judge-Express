import express, {Router} from "express";
import LostPasswordController from "../../controllers/LostPasswordController";

const router: Router = express.Router();

router.get("/:user_id", async (req, res) => {
    res.json(await LostPasswordController.getConfirmQuestion(req));
});

router.post("/", async (req, res) => {
    res.json(await LostPasswordController.resetPassword(req));
});

export = ["/password", router];
