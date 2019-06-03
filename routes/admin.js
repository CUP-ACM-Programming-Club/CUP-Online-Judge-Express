const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.use(...require("./admin/problem"));
router.use(...require("./admin/contest"));
router.use(...require("./admin/account"));
router.use(...require("./admin/topic"));
module.exports = ["/admin", auth, admin, router];