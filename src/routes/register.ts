import express, {Router} from "express";
import UserRegisterManager from "../manager/user/UserRegisterManager";
const router: Router = express.Router();

router.post("/", async (req, res) => {
    res.json(await UserRegisterManager.registerUserRequest(req));
});

export = ["/register", router];
