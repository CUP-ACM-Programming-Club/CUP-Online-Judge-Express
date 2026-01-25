import express from "express";
const router = express.Router();
import auth from "../middleware/auth";
router.use(...require("./env/client"));

export = ["/env", auth, router];
