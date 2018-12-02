const query = require("./mysql_query");
const cache_query = require("./mysql_cache");
const const_variable = require("./const_name");
const NORMAL_SUBMISSION = 1;
const CONTEST_SUBMISSION = 2;
const TOPIC_SUBMISSION = 3;
const NOTEXIST = 0;
const PUBLIC = 1;
const PRIVATE = 2;
const LANGMASK = const_variable.langmask;

function deepCopy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

async function problemInFutureOrCurrentContest(problem_id) {
	const data = await cache_query(`select contest_id,start_time,end_time from contest where
contest_id in (select contest_id from contest_problem where problem_id = ?)
and end_time > NOW()`, [problem_id]);
	return (data && data.length > 0);
}


async function problemPublic(problem_id) {
	const data = await cache_query("select defunct from problem where problem_id = ?", [problem_id]);
	if (!data || data.length === 0) {
		return NOTEXIST;
	} else {
		return data[0].defunct === "N" ? PUBLIC : PRIVATE;
	}
}

async function makePrependAndAppendCode(problem_id, source, language) {
	const data = await cache_query("select * from prefile where problem_id = ? and language = ?", [problem_id, language]);

	let new_source = deepCopy(source);

	if (data.length === 0) {
		return new_source;
	}

	for (let i of data) {
		if (parseInt(i.prepend) === 1) {
			new_source = i.code + "\n" + new_source;
		} else {
			new_source += "\n" + i.code;
		}
	}
	return new_source;
}

function checkLangmask(language) {
	return Boolean((!LANGMASK) & (1 << language));
}


module.exports = async function (req, data) {
	let submission_type = 0;
	if (data.type === "problem") {
		submission_type = NORMAL_SUBMISSION;
	} else if (data.type === "contest") {
		submission_type = CONTEST_SUBMISSION;
	} else if (data.type === "topic") {
		submission_type = TOPIC_SUBMISSION;
	}
	if (submission_type === 0) {
		return {
			status: "error",
			statement: "submission type is not valid"
		};
	}

	if (data.type === NORMAL_SUBMISSION) {
		const originalProblemId = parseInt(data.id);
		const language = parseInt(data.language);
		if (isNaN(originalProblemId)) {
			return {
				status: "error",
				statement: "Problem ID is not valid"
			};
		}
		const positiveProblemId = Math.abs(originalProblemId);
		if (!checkLangmask(language)) {
			return {
				status: "error",
				statement: "Your language is not valid"
			};
		}
		const problemPublicStatus = problemPublic(positiveProblemId);
		switch (problemPublicStatus) {
		case NOTEXIST:
			return {
				status: "error",
				statement: "problem is not exist"
			};
		case PUBLIC:
			break;
		case PRIVATE:
			if (req.session.isadmin || req.session.editor || req.session.problem_maker[`p${positiveProblemId}`]) {
				break;
			} else {
				return {
					status: "error",
					statement: "You don't have privilege to access this problem"
				};
			}
		}
		if (problemInFutureOrCurrentContest(positiveProblemId)) {
			return {
				status: "error",
				statement: "problem is in current or future contest."
			};
		}

		const source_code = makePrependAndAppendCode(positiveProblemId, data.source, language);
		const source_code_user = deepCopy(data.source);
		const IP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
		const judger = "待分配";
		const fingerprint = data.fingerprint;
		const code_length = source_code_user.length;
		const share = Boolean(data.share);
		const result = await query(`insert into solution(problem_id,user_id,in_date,language,ip,code_length,share,judger,fingerprint)
		values(?,?,NOW(),?,?,?,?,?,?)`, [positiveProblemId, req.session.user_id, language, IP, code_length, share, judger, fingerprint]);
		const solution_id = result.insertId;
		let promiseArray = [query(`insert into source_code_user(solution_id,source)
		values(?,?)`, [solution_id, source_code_user]),
		query(`insert into source_code(solution_id, source)
		values(?,?)`, [solution_id, source_code])
		];
		if (originalProblemId !== positiveProblemId) {
			promiseArray.push(query(`insert into custominput(solution_id, input_text)
            values(?,?)`, [solution_id, data.input_text]));
			//INSERT INTO `custominput`(`solution_id`,`input_text`)VALUES('$insert_id','$input_text')
		}
		await Promise.all(promiseArray);
		return {
			status: "OK",
			solution_id
		};
	}
};
