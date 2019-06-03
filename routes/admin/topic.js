const express = require("express");
const router = express.Router();
router.use(...require("./topic/list"));
module.exports = ["/topic", router];