const {assertInt, assertString} = require("../util");
import { contestCheatRepository } from "../ports/ContestCheatRepository";
import { ContestCheatingRecorder } from "../ports/ContestCheatingRecorder";
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
	await contestCheatRepository.insertCheat({user_id, solution_id, contest, num});
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
	await Promise.all([...getSet(contest, user_id)].map(el => contestCheatRepository.markChecked(el as any)));
}

async function banChecker(contest: number | string, user_id: string) {
	if (getSet(contest, user_id).size > 1) {
		await banUser(user_id, dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"));
		await removeBannedSolution(contest, user_id);
	}
}

export class Cheating implements ContestCheatingRecorder {
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
		const result = await contestCheatRepository.findCheats(userId, contest);
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
