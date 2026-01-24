import express from "express";
const router = express.Router();

router.use(...(require("./problem/code_length") as any));
router.use(...(require("./problem/solve_map") as any));

module.exports = ["/problem", router];
