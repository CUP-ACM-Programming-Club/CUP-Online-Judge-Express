import express, { Router } from "express";
import { container } from "../../../main/di/container";
import { TYPES } from "../../../main/di/types";
import { RegisterService } from "../../../application/auth/RegisterService";

const registerService = container.get<RegisterService>(TYPES.RegisterService);
const router: Router = express.Router();

router.post("/", async (req, res) => {
    res.json(await registerService.registerUser(req));
});

export = ["/register", router];
