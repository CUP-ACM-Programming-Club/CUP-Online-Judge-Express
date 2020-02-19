import express from "express";
const router = express.Router();
const auth = require("../middleware/auth");
router.use(...require("./env/client"));

export = ["/env", auth, router];
