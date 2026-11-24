import express from "express";
import UserController from "../../controllers/UserController";
const router = express.Router();

router.get("/:user_id", async (req, res) => {
    res.json(await UserController.getUserEmail(req));
});

export default router;
