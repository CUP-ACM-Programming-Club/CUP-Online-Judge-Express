import express from "express";
const router = express.Router();
const auth = require("../middleware/auth");
// @ts-ignore
const website_dir = global.config.website.dir;
const path = require("path");
const image_dir = path.join(website_dir, "images");
const [error] = require("../module/const_var");
const bluebird = require("bluebird");
const base64Img = bluebird.promisifyAll(require("base64-img"));
const fs = bluebird.promisifyAll(require("fs"));
const isImage = require("is-image");
const { mkdirAsync } = require("../module/file/mkdir");

function validateProblemId(req: any) {
	const problem_id = req.params.problem_id;
	if (!isNaN(problem_id)) {
		return parseInt(problem_id);
	} else {
		return false;
	}
}

function getPhotoDir(problem_id: any, key: any) {
	return path.join(image_dir, problem_id.toString(), key);
}

async function readPhoto(problem_id: any, key: any) {
	const dirPath = getPhotoDir(problem_id, key);
	await mkdirAsync(dirPath);
	const photoList = await readPhotoDir(problem_id, key);
	return await Promise.all(photoList.map(async (el: any) => {
		return {
			name: path.basename(el).substring(0, el.lastIndexOf(".")),
			data: await base64Img.base64Async(path.join(dirPath, el))
		};
	}));
}

async function readPhotoDir(problem_id: any, key: any) {
	const dirPath = getPhotoDir(problem_id, key);
	return (await fs.readdirAsync(dirPath)).filter((el: any) => isImage(el));
}

async function photoHandler(req: any, res: any, key: any) {
	let problem_id: any;
	if ((problem_id = validateProblemId(req)) === false) {
		res.json(error.invalidProblemID);
		return;
	}
	res.json({
		status: "OK",
		data: await readPhoto(problem_id, key)
	});
}

router.get("/description/:problem_id", async (req: any, res: any) => {
	await photoHandler(req, res, "description");
});

router.get("/input/:problem_id", async (req: any, res: any) => {
	await photoHandler(req, res, "input");
});

router.get("/output/:problem_id", async (req: any, res: any) => {
	await photoHandler(req, res, "output");
});

router.get("/hint/:problem_id", async (req: any, res: any) => {
	await photoHandler(req, res, "hint");
});

module.exports = ["/photo", auth, router];
