const express = require("express");
const router = express.Router();
router.use(...require("./account/list"));
module.exports = ["/account", router];