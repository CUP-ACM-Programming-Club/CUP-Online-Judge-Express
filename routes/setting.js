const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

router.use("/ban_user", require("./setting/ban_user"));

module.exports = ["/setting", auth, router];
