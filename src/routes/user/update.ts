import express from "express";
const router = express.Router();
import profile from "./update/profile";

router.use("/profile", profile);

export default router;
