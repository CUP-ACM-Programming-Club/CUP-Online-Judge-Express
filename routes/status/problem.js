const express = require("express");
const router = express.Router();

router.use(...require("./problem/code_length"));

module.exports = ["/problem", router];
