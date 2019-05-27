const express = require("express");
const router = express.Router();
router.use(...require("./update/profile"));
module.exports = ["/update", router];