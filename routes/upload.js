const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const zlib = require("zlib");
const upload = multer({dest: "uploads/"});
router.post("/",upload.single("fps"),(req,res)=>{
	console.log(req.file);
	fs.readFile(req.file.path,(err,data)=>{
		zlib.gunzip(data,(err,data)=>{
			console.log(data);
			console.log(data.toString());
			console.log(JSON.parse(data.toString()));
		});
	});
	res.json({
		status:"success"
	});
});

module.exports = router;