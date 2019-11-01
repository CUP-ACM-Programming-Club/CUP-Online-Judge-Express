const {assertInt, assertString} = require("../util");
const query = require("../mysql_query");
const dayjs = require("dayjs");
const BanModel = require("../user/ban");
const cache = {};

function getSet(contest, user_id) {
	return cache[contest][user_id];
}

async function addToDatabase(payload) {
	const {user_id, solution_id, contest, num} = payload;
	await query("insert into contest_cheat(contest_id, solution_id, user_id, num, checked) values(?,?,?,?,?)",
		[contest, solution_id, user_id, num, false]);
}

function addToCache(payload) {
	const {user_id, solution_id, contest} = payload;
	getSet(contest, user_id).add(solution_id);
}

async function addToCacheAndDatabase(payload) {
	const {user_id, contest} = payload;
	const oldSize = getSet(contest, user_id).size;
	addToCache(payload);
	const newSize = getSet(contest, user_id).size;
	if (oldSize !== newSize) {
		await addToDatabase(payload);
	}
}

async function banUser(user_id, datetime) {
	await BanModel.set(user_id, datetime);
}

async function removeBannedSolution(contest, user_id) {
	await Promise.all([...getSet(contest, user_id)].map(el => query("update contest_cheat set checked = true where solution_id = ?", [el])));
}

async function banChecker(contest, user_id) {
	if (getSet(contest, user_id).size > 1) {
		await banUser(user_id, dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"));
		await removeBannedSolution(contest, user_id);
	}
}

module.exports = function () {
	this.initContest = function (contest) {
		if (!cache.hasOwnProperty(contest)) {
			cache[contest] = {};
		}
	};

	this.initUser = function (contest, user_id) {
		if (!cache.hasOwnProperty(contest)) {
			this.initContest(contest);
		}
		if (!cache[contest].hasOwnProperty(user_id)) {
			cache[contest][user_id] = new Set();
		}
	};

	this.getCheatingList = async function (contest, user_id) {
		const result = await query("select * from contest_cheat where user_id = ? and contest_id = ?", [user_id, contest]);
		return result.map(el => el.solution_id);
	};

	this.initCache = async function (contest, user_id) {
		const list = await this.getCheatingList(contest, user_id);
		list.forEach(el => getSet(contest, user_id).add(el));
	};

	this.addCheating = async function (user_id, contest, payload) {
		assertString(user_id);
		contest = assertInt(contest);
		this.initContest(contest);
		this.initUser(contest, user_id);
		await this.initCache(contest, user_id);
		await addToCacheAndDatabase(Object.assign({solution_id: -1, num: -1}, payload, {contest, user_id}));
		await banChecker(contest, user_id);
	};
};
