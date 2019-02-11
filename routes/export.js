const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
router.use("/contest_code", require("./export/contest_code"));

module.exports = ["/export", auth, router];