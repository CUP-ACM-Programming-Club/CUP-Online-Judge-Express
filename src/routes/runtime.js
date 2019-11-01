const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const cache_query = require("../module/mysql_cache");
const [error] = require("../module/const_var");

router.get("/:id", (req, res) => {

});

module.exports = ["/runtime", auth, router];
