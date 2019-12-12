interface UserMap {
	[id: string]: any
}

function InitStructure(payload: any) {
	if (typeof payload === "undefined" || payload === null) {
		payload = {};
	}
	if (!Object.prototype.hasOwnProperty.call(payload, "user_id")) {
		payload.user_id = "";
	}
	return payload;
}

function buildUserIdStructure(payload: any) {
	return {
		user_id: payload.user_id
	};
}

export class OnlineUserSet {
	private readonly __user__: UserMap;
	private readonly __normal_user__: UserMap;
	constructor() {
		this.__user__ = {};
		this.__normal_user__ = {};
	}

	get(userId: string) {
		return this.__user__[userId];
	}

	private static getValuesByTarget(userMap: UserMap) {
		return Object.values(userMap).filter(el => typeof el !== "undefined" && el !== null);
	}

	getAllValues() {
		return OnlineUserSet.getValuesByTarget(this.__user__);
	}

	getAllValuesForNormalUser() {
		return OnlineUserSet.getValuesByTarget(this.__normal_user__);
	}

	set(userId: string, payload: any) {
		payload = InitStructure(payload);
		this.__normal_user__[userId] = buildUserIdStructure(payload);
		this.__user__[userId] = payload;
		return this;
	}

	remove(userId: string) {
		if (Object.prototype.hasOwnProperty.call(this.__user__, userId)) {
			delete this.__user__[userId];
		}
		if (Object.prototype.hasOwnProperty.call(this.__normal_user__, userId)) {
			delete this.__normal_user__[userId];
		}
		return this;
	}
}

export default new OnlineUserSet();
