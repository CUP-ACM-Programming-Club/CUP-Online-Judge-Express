const express = require("express");
const router = express.Router();

router.use(...require("./problem/code_length"));
router.use(...require("./problem/solve_map"));

module.exports = ["/problem", router];
