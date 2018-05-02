const express = require("express");
const cache_query = require("../module/mysql_cache");
const router = express.Router();
const [error] = require("../module/const_var");
const page_cnt = 20;
const auth = require("../middleware/auth");

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
	let count = 0;
	let discuss_content;
	let tot = 0;
	const resolve = () => {
		++count;
		if (count >= 2) {
			res.json({
				discuss: discuss_content,
				total: tot
			});
		}
	};

	cache_query(`select * from article_content where article_id = ? 
	${req.session.isadmin ? "" : "and defunct = 'N'"} order by content_id asc 
	limit ?,?`, [id, page, page_cnt])
		.then(rows => {
			discuss_content = rows;
			resolve();
		});
	cache_query(`select count(1) as cnt from article_content where article_id = ? 
	${req.session.isadmin ? "" : "and defunct = 'N'"}`)
		.then(rows => {
			tot = parseInt(rows[0].cnt);
			resolve();
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

module.exports = ["/discuss",auth,router];
