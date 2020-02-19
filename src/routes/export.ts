import express from "express";
const router = express.Router();
const auth = require("../middleware/auth");
router.use("/contest_code", require("./export/contest_code"));

export = ["/export", auth, router];
