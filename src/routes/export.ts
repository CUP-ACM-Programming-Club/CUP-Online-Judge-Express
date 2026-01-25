import express from "express";
const router = express.Router();
import auth from "../middleware/auth";
router.use("/contest_code", require("./export/contest_code"));

export = ["/export", auth, router];
