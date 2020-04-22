import express from "express";
const router = express.Router();
router.use(...require("./update/profile"));
export = ["/update", router];
