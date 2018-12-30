const express = require("express");
const router = express.Router();
const query = require("../module/mysql_query");
const cache_query = require("../module/mysql_cache");

const [error] = require("../module/const_var");
const auth = require("../middleware/auth");

router.get("/", async (req, res, next) => {

});

module.exports = ["/specialsubject", auth, router];
