const query = require("./mysql_query");
const cache_query = require("./mysql_cache");
const const_variable = require("./const_name");
const dayjs = require("dayjs");
const client = require("./redis");
const detectClassroom = require("./detect_classroom");
const getIP = require("./getIP");
const [error] = require("../module/const_var");
const crypto = require("crypto");


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

function createCodeHash(source_code) {
	const hash = crypto.createHash("md5");
	return hash.update(source_code).digest("hex");
}

async function problemInFutureOrCurrentContest(problem_id) {
	const data = await cache_query(`select contest_id,start_time,end_time from contest where
contest_id in (select contest_id from contest_problem where problem_id = ?)
and end_time > NOW()`, [problem_id]);
	return (data && data.length > 0);
}


async function contestIsStart(contest_id) {
	const data = await cache_query("select start_time,end_time from contest where contest_id = ?", [contest_id]);
	const start_time = dayjs(data[0].start_time);
	const end_time = dayjs(data[0].end_time);
	const now = dayjs();
	return now.isAfter(start_time) && now.isBefore(end_time);
}

async function getLangmaskForContest(contest_id) {
	const data = await cache_query(`select langmask from contest 
    where contest_id = ?`, [contest_id]);
	return data[0].langmask;
}


async function getLangmaskForTopic(topic_id) {
	const data = await cache_query(`select langmask from special_subject 
    where topic_id = ?`, [topic_id]);
	return data[0].langmask;
}

async function checkContestPrivilege(req, contest_id) {
	if (req.session.isadmin || req.session.contest[`c${contest_id}`] || req.session.contest_maker[`c${contest_id}`] || req.session.contest_manager) {
		return true;
	}
	const data = await cache_query("select private,defunct from contest where contest_id = ?", [contest_id]);
	const _private = parseInt(data[0].private) === 1;
	const defunct = data[0].defunct === "Y";
	if (defunct) {
		return false;
	}
	return !_private;
}

async function limitAddressForContest(req, contest_id) {
	const referer = req.headers.referer;
	const data = await query("select limit_hostname from contest where contest_id = ?", [contest_id]);
	let limit_hostname;
	if (data && data[0] && data[0].limit_hostname) {
		limit_hostname = data[0].limit_hostname;
	}
	console.log(`limit Hostname: ${limit_hostname}`);
	console.log(`Referer: ${referer}`);
	if (limit_hostname && referer.includes(limit_hostname)) {
		return true;
	} else if (!limit_hostname) {
		return true;
	} else {
		return limit_hostname;
	}
}

async function limitClassroomAccess(req, contest_id) {
	const ip = getIP(req);
	let detectResult = detectClassroom(ip);
	console.log("Detect IP result:", detectResult);
	const data = await query("select ip_policy from contest where contest_id = ?", [contest_id]);
	let limitClassroom;
	if (data && data[0] && data[0].ip_policy) {
		limitClassroom = data[0].ip_policy.split(",").map(e => e.trim());
	} else {
		return true;
	}
	console.log("limitClassroom", limitClassroom);
	if (detectResult === null) {
		return false;
	}
	detectResult = detectResult.toString();
	let result = false;
	for (let i of limitClassroom) {
		if (i === detectResult) {
			result = true;
			break;
		}
	}
	return result;
}

async function checkTopicPrivilege(req, topic_id) {
	if (req.session.isadmin) {
		return;
	}
	const data = await cache_query("select private,defunct from special_subject where topic_id = ?", [topic_id]);
	const _private = parseInt(data[0].private) === 1;
	const defunct = data[0].defunct === "Y";
	if (defunct || _private === true) {
		throw error.errorMaker("You don't have privilege to access this topic");
	}
}

async function includeProblem(id, num, sql) {
	const data = await cache_query(sql, [id, num]);
	if (!data || data.length === 0) {
		return false;
	} else {
		return parseInt(data[0].problem_id);
	}
}

async function contestIncludeProblem(contest_id, num) {
	const result =  await includeProblem(contest_id, num, `select problem_id from contest_problem
     where contest_id = ? and num = ?`);
	if (result === false) {
		throw error.errorMaker("problem is not in contest");
	}
	return result;
}


async function TopicIncludeProblem(topic_id, num) {
	const result = await includeProblem(topic_id, num, `select problem_id from special_subject_problem
     where topic_id = ? and num = ?`);
	if (result === false) {
		throw error.errorMaker("problem is not in topic");
	}
	return result;
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
	const data = await cache_query("select * from prefile where problem_id = ? and type = ?", [problem_id, language]);

	let new_source = deepCopy(source);

	if (data.length === 0) {
		return new_source;
	}
	let prepend_added = false, append_added = false;
	for (let i of data) {
		if (parseInt(i.prepend) === 1 && prepend_added === false) {
			new_source = i.code + "\n" + new_source;
			prepend_added = true;
		} else if (append_added === false) {
			append_added = true;
			new_source += "\n" + i.code;
		}
	}
	return new_source;
}

function checkLangmask(language, langmask = LANGMASK) {
	return Boolean((~langmask) & (1 << language));
}

async function checkContestValidate(req, originalContestID, originalPID, language) {
	if (isNaN(originalContestID) || isNaN(originalPID)) {
		throw error.errorMaker("Invalid contest_id or pid");
	}
	const positiveContestID = Math.abs(originalContestID);
	let limit_address = await limitAddressForContest(req, positiveContestID);
	if (typeof limit_address === "string") {
		throw error.errorMaker(`根据管理员设置的策略，请从${limit_address}访问本页提交`);
	}
	let limit_classroom = await limitClassroomAccess(req, positiveContestID);
	if (!limit_classroom) {
		throw error.errorMaker("根据管理员的设置，您无权在本IP段提交\n为了在考试/测验期间准确验证您的身份，请在acm.cup.edu.cn提交。");
	}
	await contestIncludeProblem(positiveContestID, originalPID);
	if (!await checkContestPrivilege(req, positiveContestID)) {
		throw error.errorMaker("You don't have privilege to access this contest problem");
	}
	if (!await contestIsStart(positiveContestID)) {
		throw error.errorMaker("Contest is not start");
	}
	const contest_langmask = await getLangmaskForContest(positiveContestID);
	if (!checkLangmask(language, contest_langmask)) {
		throw error.errorMaker("Your submission's language is invalid");
	}
	return true;
}

async function prepareRequest(req, cookie) {
	if (!req.session || !req.session.user_id) {
		let obj = {};
		obj.session = {};
		obj.session.user_id = cookie["user_id"];
		let user_id = cookie["user_id"];
		let token = cookie["token"];
		const original_token = await client.lrangeAsync(`${user_id}token`, 0, -1);
		if (original_token.indexOf(token) !== -1) {
			const login_action = require("./login_action");
			await login_action(obj, user_id);
		}
		Object.assign(req, obj);
	}
}

function dataErrorChecker(data) {
	if (!data) {
		throw error.errorMaker("submission invalid!");
	} else if (data.source && data.source.length > 64 * 1024) {
		throw error.errorMaker("Your code is too long!");
	} else if (data.input_text && data.input_text.length && data.input_text.length > 1000) {
		throw error.errorMaker("Your custom input length cannot exceed 1000!");
	}
}

function classifySubmissionType(data) {
	let submission_type = undefined;
	if (data.type === "problem") {
		submission_type = NORMAL_SUBMISSION;
	} else if (data.type === "contest") {
		submission_type = CONTEST_SUBMISSION;
	} else if (data.type === "topic") {
		submission_type = TOPIC_SUBMISSION;
	}
	if (typeof submission_type === "undefined") {
		throw error.errorMaker("submission type is not valid");
	}
	return submission_type;
}

async function insertTransaction({result, source_code, source_code_user, data}, testRun) {
	const solution_id = result.insertId;
	let promiseArray = [query(`insert into source_code_user(solution_id,source,hash)
		values(?,?,?)`, [solution_id, source_code_user, createCodeHash(source_code_user)]),
	query(`insert into source_code(solution_id, source)
		values(?,?)`, [solution_id, source_code])
	];
	if (testRun) {
		promiseArray.push(query(`insert into custominput(solution_id, input_text)
            values(?,?)`, [solution_id, data.input_text]));
	}
	await Promise.all(promiseArray);
	return {
		status: "OK",
		solution_id
	};
}

async function normalSubmissionTransaction(req, data) {
	const originalProblemId = parseInt(data.id);
	const language = parseInt(data.language);
	if (isNaN(originalProblemId)) {
		throw error.errorMaker("Problem ID is not valid");
	}
	const positiveProblemId = Math.abs(originalProblemId);
	if (!checkLangmask(language)) {
		throw error.errorMaker("Your language is not valid");
	}
	const problemPublicStatus = await problemPublic(positiveProblemId);
	switch (problemPublicStatus) {
	case NOTEXIST:
		throw error.errorMaker("problem is not exist");
	case PUBLIC:
		break;
	case PRIVATE:
		if (req.session.isadmin || req.session.editor || req.session.problem_maker[`p${positiveProblemId}`]) {
			break;
		} else {
			throw error.errorMaker("You don't have privilege to access this problem");
		}
	}
	if (await problemInFutureOrCurrentContest(positiveProblemId) && !(req.session.isadmin || req.session.editor || req.session.problem_maker[`p${positiveProblemId}`])) {
		throw error.errorMaker("problem is in current or future contest.");
	}

	const source_code = await makePrependAndAppendCode(positiveProblemId, data.source, language);
	const [source_code_user, IP, judger, fingerprint, fingerprintRaw, share] = [deepCopy(data.source), getIP(req), "待分配", data.fingerprint, data.fingerprintRaw, Boolean(data.share)];
	const code_length = source_code_user.length;
	const result = await query(`insert into solution(problem_id,user_id,in_date,language,ip,code_length,share,judger,fingerprint,fingerprintRaw)
		values(?,?,NOW(),?,?,?,?,?,?,?)`, [originalProblemId, req.session.user_id, language, IP, code_length, share, judger, fingerprint, fingerprintRaw]);
	return await insertTransaction({result, source_code, source_code_user, data}, originalProblemId !== positiveProblemId);
}

module.exports = async function (req, data, cookie) {
	await prepareRequest(req, cookie);
	dataErrorChecker(data);
	const submissionType = classifySubmissionType(data);
	if (submissionType === NORMAL_SUBMISSION) {
		return normalSubmissionTransaction(req, data);
	}
	const language = parseInt(data.language);
	const source_code_user = deepCopy(data.source);
	const IP = getIP(req);
	const judger = "待分配";
	const fingerprint = data.fingerprint;
	const fingerprintRaw = data.fingerprintRaw;
	const code_length = source_code_user.length;
	if (submissionType === CONTEST_SUBMISSION) {
		const originalContestID = parseInt(data.cid);
		const originalPID = parseInt(data.pid);
		const positiveContestID = Math.abs(originalContestID);
		const testRunFlag = originalContestID !== positiveContestID;
		let problemId = await contestIncludeProblem(positiveContestID, Math.abs(originalPID));
		const source_code = await makePrependAndAppendCode(problemId, data.source, language);
		data.id = problemId;
		await checkContestValidate(req, originalContestID, originalPID, language);
		if (testRunFlag) {
			problemId = -Math.abs(problemId);
		}
		const result = await query(`INSERT INTO solution(problem_id,user_id,in_date,language,ip,code_length,contest_id,num,judger,fingerprint,fingerprintRaw)
	    values(?,?,NOW(),?,?,?,?,?,?,?,?)`, [problemId, req.session.user_id, language, IP, code_length, positiveContestID, originalPID, judger, fingerprint, fingerprintRaw]);
		return await insertTransaction({result, source_code, source_code_user, data}, testRunFlag);
	} else if (submissionType === TOPIC_SUBMISSION) {
		const originalTopicID = parseInt(data.tid);
		const originalPID = parseInt(data.pid);
		const positiveTopicID = Math.abs(originalTopicID);
		const testRunFlag = originalTopicID !== positiveTopicID;
		if (isNaN(originalTopicID) || isNaN(originalPID)) {
			throw error.errorMaker("Invalid topic_id or pid");
		}
		let problemId = await TopicIncludeProblem(positiveTopicID, originalPID);
		const sourceCode = await makePrependAndAppendCode(problemId, data.source, language);
		await checkTopicPrivilege(req, positiveTopicID);
		const topicLangmask = await getLangmaskForTopic(positiveTopicID);
		if (!checkLangmask(language, topicLangmask)) {
			throw error.errorMaker("Your submission's language is invalid");
		}
		if (testRunFlag) {
			problemId = -Math.abs(problemId);
		}
		const result = await query(`insert into solution(problem_id,user_id,in_date,language,ip,code_length,topic_id,num,judger,fingerprint,fingerprintRaw)
		values(?,?,NOW(),?,?,?,?,?,?,?,?)`, [problemId, req.session.user_id, language, IP, code_length, positiveTopicID, originalPID, judger, fingerprint, fingerprintRaw]);
		return await insertTransaction({result, source_code: sourceCode, source_code_user, data}, testRunFlag);
	}
};
