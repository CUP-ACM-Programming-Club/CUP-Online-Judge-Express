const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

router.get("/", (req, res) => {
	let data = {
		admin: req.session.isadmin
	};
	res.json({
		status: "OK",
		data
	});
});


module.exports = ["/privilege",auth,router];
