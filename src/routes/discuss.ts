const express = require("express");
import TopicService from "../service/TopicService";
import HttpError from "../module/util/HttpError";

const router = express.Router();
const [error, ok] = require("../module/const_var");
const page_cnt = 20;
import auth from "../middleware/auth";
const DiscussInterceptor = require("../module/discuss/interceptor");
const { checkCaptcha } = require("../module/captcha_checker");

const checkPrivilege = (req: any) => {
	return req.session.isadmin || req.session.source_browser;
};

const checkValidation = (number: any) => {
	number = parseInt(number);
	if (isNaN(number) || number <= 0) {
		return 0;
	} else {
		return number;
	}
};

router.get("/my", async (req: any, res: any) => {
	let page = checkValidation(req.query.page);
	const user_id = req.session.user_id;
	try {
		const data = await TopicService.getTopicList(page, page_cnt, req.session.isadmin, user_id);
		res.json(data);
	} catch (e: any) {
		res.json(error.invalidParams);
	}
});

router.get("/:id", async (req: any, res: any) => {
	if (!checkPrivilege(req)) {
		if (global.contest_mode) {
			res.json(error.contestMode);
			return;
		}
	}
	let page = checkValidation(req.query.page);
	const id = checkValidation(req.params.id);
	if (id === 0) {
		res.json(error.invalidParams);
		return;
	}
	try {
		const data = await TopicService.getTopicDetail(id, page, page_cnt, req.session.user_id, req.session.isadmin);
		res.json(data);
	} catch (e: any) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
		} else {
			console.log(e);
			res.json(error.invalidParams);
		}
	}
});

router.get("/", async (req: any, res: any) => {
	let page = checkValidation(req.query.page);
	if (!checkPrivilege(req)) {
		if (global.contest_mode) {
			res.json(error.contestMode);
			return;
		}
	}

	try {
		const data = await TopicService.getTopicList(page, page_cnt, req.session.isadmin);
		res.json(data);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.post("/reply/:id", async (req: any, res: any) => {
	const id = req.params.id === undefined ? -1 : parseInt(req.params.id);
	if (id < 1) {
		res.json(error.invalidParams);
	} else {
		if (!checkCaptcha(req, "discuss")) {
			res.json(error.invalidCaptcha);
		} else {
			const content = req.body.comment;
			try {
				const result = await TopicService.addReply(id, req.session.user_id, content);
				res.json(result);
			} catch (e) {
				console.log(e);
				res.json(error.database);
			}
		}
	}
});

router.get("/search/:search_val", async (req: any, res: any) => {
	const search_val = req.params.search_val || "";
	let page = checkValidation(req.query.page);
	try {
		const result = await TopicService.searchTopics(search_val, page, page_cnt);
		res.json({
			status: "OK",
			data: result
		});
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.post("/newpost", async (req: any, res: any) => {
	if (!checkCaptcha(req, "newpost")) {
		res.json(error.invalidCaptcha);
	} else {
		const content = req.body.content;
		const title = req.body.title;
		try {
			const insertId = await TopicService.addNewPost(req.session.user_id, title, content);
			res.json({
				status: "OK",
				data: insertId
			});
		} catch (e) {
			res.json({
				status: "error",
				statement: "insert happend to be error.Please contact maintainer"
			});
		}
	}
});

router.post("/update/main/:id", async (req: any, res: any) => {
	if (!checkCaptcha(req, "edit")) {
		res.json(error.invalidCaptcha);
	} else {
		const article_id = parseInt(req.params.id);
		const content = req.body.content;
		const title = req.body.title;
		try {
			await TopicService.updatePost(article_id, req.session.user_id, title, content);
			res.json(ok.ok);
		} catch (e) {
			console.log(e);
			res.json({
				status: "error",
				statement: "error happend in modify methods.Please contact admin"
			});
		}
	}
});

router.post("/update/:id", async (req: any, res: any) => {
	const article_id = parseInt(req.params.id);
	try {
		const data = await TopicService.getPostContent(article_id);
		res.json({
			status: "OK",
			data: data
		});
	} catch (e: any) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
		} else {
			console.log(e);
			res.json(error.database);
		}
	}
});

router.post("/update/reply/:id/:comment_id", async (req: any, res: any) => {
	if (!checkCaptcha(req, "edit")) {
		res.json(error.invalidCaptcha);
	} else {
		const article_id = parseInt(req.params.id);
		const content = req.body.content;
		const comment_id = parseInt(req.params.comment_id);
		try {
			await TopicService.updateReply(article_id, comment_id, req.session.user_id, content);
			res.json(ok.ok);
		} catch (e) {
			res.json({
				status: "error",
				statement: "error happend in modify reply. Please contact admin"
			});
		}
	}
});

router.get("/update/reply/:id/:comment_id", async (req: any, res: any) => {
	const article_id = parseInt(req.params.id);
	const comment_id = parseInt(req.params.comment_id);
	try {
		const data = await TopicService.getReplyContent(article_id, comment_id);
		res.json({
			status: "OK",
			data: data
		});
	} catch (e: any) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
		} else {
			res.json(error.database);
		}
	}
});

router.get("/update/reply/block/:id/:comment_id", async (req: any, res: any) => {
	const article_id = parseInt(req.params.id);
	const comment_id = parseInt(req.params.comment_id);
	try {
		await TopicService.blockReply(article_id, comment_id);
		res.json(ok.ok);
	} catch (e) {
		res.json(error.invalidParams);
	}
});

export = ["/discuss", auth, DiscussInterceptor, router];
