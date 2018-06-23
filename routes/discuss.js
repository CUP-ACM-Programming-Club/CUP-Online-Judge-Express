const express = require("express");
const cache_query = require("../module/mysql_cache");
const router = express.Router();
const [error] = require("../module/const_var");
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
		(select t.*,users.avatar from (select * from article_content where article_id = ? 
	${req.session.isadmin ? "" : "and defunct = 'N'"})t left join users
	on users.user_id = t.user_id)joint
	 order by content_id asc 
	limit ?,?`, [id, page, page_cnt]),
		cache_query(`select count(1) as cnt from article_content where article_id = ? 
	${req.session.isadmin ? "" : "and defunct = 'N'"}`, [id]),
		cache_query(`select tmp.*,users.avatar,users.nick,users.biography,users.solved from (
		select * from article where article_id = ? ${req.session.isadmin ? "" : "and defunct = 'N'"})
		tmp
		left join users on users.user_id = tmp.user_id
		`, [id])
	]);
	_article[0].content = md.render(_article[0].content);
	res.json({
		discuss: discuss_content,
		total: _tot[0].cnt,
		discuss_header_content: _article[0]
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
	${req.session.isadmin ? "" : "where defunct = 'N'"} order by article_id asc 
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

module.exports = ["/discuss", auth, router];
