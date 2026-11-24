import express, { Router } from "express";
import RegisterController from "../controllers/RegisterController";

const router: Router = express.Router();

router.post("/", async (req, res) => {
    res.json(await RegisterController.register(req));
});

export = ["/register", router];
