const {assertInt, assertString} = require("../util");
const query = require("../mysql_query");
const dayjs = require("dayjs");
const BanModel = require("../user/ban");
const cache = {} as any;

interface ICheatPayload {
	user_id: string,
	solution_id: number | string,
	contest: number | string,
	num: number | string
}

function getSet(contest: number | string, user_id: string) {
	return cache[contest][user_id];
}

async function addToDatabase(payload: ICheatPayload) {
	const {user_id, solution_id, contest, num} = payload;
	await query("insert into contest_cheat(contest_id, solution_id, user_id, num, checked) values(?,?,?,?,?)",
		[contest, solution_id, user_id, num, false]);
}

function addToCache(payload: ICheatPayload) {
	const {user_id, solution_id, contest} = payload;
	getSet(contest, user_id).add(solution_id);
}

async function addToCacheAndDatabase(payload: ICheatPayload) {
	const {user_id, contest} = payload;
	const oldSize = getSet(contest, user_id).size;
	addToCache(payload);
	const newSize = getSet(contest, user_id).size;
	if (oldSize !== newSize) {
		await addToDatabase(payload);
	}
}

async function banUser(user_id: string, datetime: string) {
	await BanModel.set(user_id, datetime);
}

async function removeBannedSolution(contest: number | string, user_id: string) {
	await Promise.all([...getSet(contest, user_id)].map(el => query("update contest_cheat set checked = true where solution_id = ?", [el])));
}

async function banChecker(contest: number | string, user_id: string) {
	if (getSet(contest, user_id).size > 1) {
		await banUser(user_id, dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"));
		await removeBannedSolution(contest, user_id);
	}
}

export class Cheating {
	initContest(contest: number | string) {
		if (!Object.prototype.hasOwnProperty.call(cache, contest)) {
			cache[contest] = {};
		}
		return this;
	}

	initUser(contest: number | string, userId: string) {
		if (!Object.prototype.hasOwnProperty.call(cache, contest)) {
			this.initContest(contest);
		}
		if (!Object.prototype.hasOwnProperty.call(cache[contest], userId)) {
			cache[contest][userId] = new Set();
		}
	}

	async getCheatingList(contest: number | string, userId: string) {
		const result = await query("select * from contest_cheat where user_id = ? and contest_id = ?", [userId, contest]);
		return result.map((el: any) => el.solution_id);
	}

	async initCache(contest: number | string, userId: string) {
		const list = await this.getCheatingList(contest, userId);
		list.forEach((el: any) => getSet(contest, userId).add(el));
	}

	async addCheating(userId: string, contest: number | string, payload: any) {
		assertString(userId);
		contest = assertInt(contest);
		this.initContest(contest);
		this.initUser(contest, userId);
		await this.initCache(contest, userId);
		await addToCacheAndDatabase(Object.assign({solution_id: -1, num: -1}, payload, {contest, user_id: userId}));
		await banChecker(contest, userId);
	}
}

export default new Cheating();
