const express = require("express");
const cache_query = require("../module/mysql_cache");
const query = require("../module/mysql_query");
const router = express.Router();
const [error, ok] = require("../module/const_var");
const page_cnt = 20;
const auth = require("../middleware/auth");

const md = require("markdown-it")({
	html: true,
	breaks: true
});
const mh = require("markdown-it-highlightjs");
const mk = require("markdown-it-katex");
md.use(mk);
md.use(mh);
const markdownPack = (html) => {
	return `<div class="markdown-body">${html}</div>`;
};

const checkCaptcha = (req, from) => {
	return req.session.captcha.from === from && req.session.captcha.captcha.toLowerCase() === req.body.captcha.toLowerCase();
};

const checkValidation = (number) => {
	number = parseInt(number);
	if (isNaN(number) || number <= 0) {
		return 0;
	}
	else {
		return number;
	}
};

router.get("/:id", async (req, res) => {
	let page = checkValidation(req.query.page);
	const id = checkValidation(req.params.id);
	if (id === 0) {
		res.json(error.invalidParams);
		return;
	}
	let discuss_content;
	let _tot, _article;
	[discuss_content, _tot, _article] = await Promise.all([
		cache_query(`select * from 
		(select t.*,users.avatar,users.nick from (select * from article_content where article_id = ? 
	${req.session.isadmin ? "" : "and defunct = 'N'"})t left join users
	on users.user_id = t.user_id)joint
	 order by comment_id asc 
	limit ?,?`, [id, page, page_cnt]),
		cache_query(`select count(1) as cnt from article_content where article_id = ? 
	${req.session.isadmin ? "" : "and defunct = 'N'"}`, [id]),
		cache_query(`select tmp.*,users.avatar,users.nick,users.biography,users.solved from (
		select * from article where article_id = ? ${req.session.isadmin ? "" : "and defunct = 'N'"})
		tmp
		left join users on users.user_id = tmp.user_id
		`, [id])
	]);
	_article[0].content = markdownPack(md.render(_article[0].content));
	res.json({
		discuss: discuss_content,
		total: _tot[0].cnt,
		discuss_header_content: _article[0],
		owner: req.session.user_id
	});
});
router.get("/", async (req, res) => {
	let page = checkValidation(req.query.page);
	let discuss_list;
	let tot = 0;
	let count = 0;
	const resolve = () => {
		++count;
		if (count >= 2) {
			res.json({
				discuss: discuss_list,
				total: tot
			});
		}
	};
	cache_query(`select * from article 
	${req.session.isadmin ? "" : "where defunct = 'N'"} order by article_id desc
	limit ?,?`, [page, page_cnt])
		.then(rows => {
			discuss_list = rows;
			resolve();
		});
	cache_query(`select count(1) as cnt from article 
	${req.session.isadmin ? "" : "where defunct = 'N'"}`)
		.then(rows => {
			tot = parseInt(rows[0].cnt);
			resolve();
		});
});

router.post("/:id", (req, res) => {
	const id = req.params.id === undefined ? -1 : parseInt(req.params.id);
	if (id < 1) {
		res.json(error.invalidParams);
	}
	else {
		if (!checkCaptcha(req, "discuss")) {
			res.json(error.invalidCaptcha);
		}
		else {
			const content = req.body.comment;
			query(`insert into article_content(user_id,content,article_id)
		values(?,?,?)`, [req.session.user_id, content, id]);
			res.json(ok.serverReceived);
		}
	}
});

router.post("/newpost", (req, res) => {
	if (!checkCaptcha(req, "newpost")) {
		res.json(error.invalidCaptcha);
	}
	else {
		const content = req.body.content;
		const title = req.body.title;
		query("insert into article(user_id,title,content)values(?,?,?)", [req.session.user_id, title, content])
			.then(rows => {
				res.json({
					status: "OK",
					data: rows.insertId
				});
			})
			.catch(() => {
				res.json({
					status: "error",
					statement: "insert happend to be error.Please contact maintainer"
				});

			});
	}
});

router.post("/update/main/:id", (req, res) => {
	if (!checkCaptcha(req, "editpost")) {
		res.json(error.invalidCaptcha);
	}
	else {
		const article_id = parseInt(req.params.id);
		const content = req.body.content;
		const title = req.body.title;
		query("update article set title = ? , content = ? where article_id = ? and user_id = ?",
			[title, content, article_id, req.session.user_id])
			.then(() => {
				res.json(ok.ok);
			})
			.catch(() => {
				res.json({
					status: "error",
					statement: "error happend in modify methods.Please contact adin"
				});
			});
	}
});

router.post("/update/reply/:id/:comment_id", (req, res) => {
	if (!checkCaptcha(req, "editreply")) {
		res.json(error.invalidCaptcha);
	}
	else {

	}
});

module.exports = ["/discuss", auth, router];
