const { encryptPassword } = require("../util");
import dayjs from "dayjs";
const sequelize = require("../../orm/instance/sequelize");
const User = sequelize.import("user", require("../../orm/models/users"));
User.sync();
const salt = global.config.salt;

async function validateUserId(user_id: string) {
	const result = await User.findOne({ where: { user_id } });
	if (result.get()) {
		throw new Error("user is existed");
	}
	const len = user_id.length;
	if (len < 3 || len > 20) {
		throw new Error("Invalid length of user_id");
	}
	if (!/[a-zA-Z0-9]/.test(user_id)) {
		throw new Error("user_id should only contain number or English characters!");
	}
}

async function validatePassword(password: string) {
	const len = password.length;
	if (len > 100 || len < 8) {
		throw new Error("The length of password should between 8 and 100");
	}
}

async function validateIp() {
	return true;
}

async function validateConfirmQuestion(confirmQuestion: string) {
	const len = confirmQuestion.length;
	if (len === 0) {
		throw new Error("Confirm question should not be empty!");
	}
}

async function validateConfirmAnswer(confirmAnswer: string) {
	const len = confirmAnswer.length;
	if (len === 0) {
		throw new Error("Confirm answer should not be empty!");
	}
}

async function validateNick(nick: string) {
	const len = nick.length;
	if (len > 100) {
		throw new Error("The length of nick should less than 100");
	}
}

class Account {
	constructor() {
	}

	async create(payload: any) {
		try {
			const { user_id, password, ip, confirmQuestion, confirmAnswer, nick } = payload;
			await validateUserId(user_id);
			await validatePassword(password);
			await validateConfirmQuestion(confirmQuestion);
			await validateConfirmAnswer(confirmAnswer);
			await validateNick(nick);
			await validateIp();
			const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
			await User.create(Object.assign({
				user_id: "", email: "", ip: "", accesstime: now, password: "", reg_time: now, nick: "", school: "",
				confirmquestion: "", confirmanswer: ""
			}, {
				user_id,
				ip,
				password: encryptPassword(password, salt),
				confirmquestion: confirmQuestion,
				confirmanswer: encryptPassword(confirmAnswer, salt),
				nick
			}));
			return true;
		}
		catch (e) {
			return (e as Error).message;
		}
	}
}

module.exports = new Account();
