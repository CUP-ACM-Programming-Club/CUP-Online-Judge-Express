/**
 * user 领域用例测试：端口绑定内存假实现，经控制器调用，验证返回结构与报错文案保持不变。
 */
import { expect } from "chai";
import { bindPort, boundImpl } from "../../application/ports/registry";
import { userRepository, UserRepository, UserInfoDAO } from "../../application/ports/UserRepository";
import { userInviteRepository, UserInviteRepository, IInviteInfo } from "../../application/ports/UserInviteRepository";
import { userBanRepository, UserBanRepository } from "../../application/ports/UserBanRepository";
import { encryptPassword, decryptPassword } from "../../application/util";
import RegisterController from "../../interfaces/http/controllers/RegisterController";
import LostPasswordController from "../../interfaces/http/controllers/LostPasswordController";
import InviteController from "../../interfaces/http/controllers/InviteController";
import UserController from "../../interfaces/http/controllers/UserController";
const loginAction = require("../../application/auth/login_action");
const BanModel = require("../../application/user/ban");

const salt = global.config.salt || "thisissalt";

class InMemoryUserRepository implements Partial<UserRepository> {
	users = new Map<string, any>();
	privileges: any[] = [];
	changed: any[] = [];
	async getUser(userId: string) { return (this.users.get(userId) as UserInfoDAO) || null; }
	async addUser(row: any) { this.users.set(row.userId, { user_id: row.userId, newpassword: row.encryptedPassword, confirmanswer: row.encryptedConfirmAnswer, nick: row.nick, ip: row.ip }); return { affectedRows: 1 }; }
	async changePassword(userId: string, encrypted: string) { this.changed.push([userId, encrypted]); }
	async getPrivilegeRows(userId: string) { return this.privileges.filter(p => p.user_id === userId); }
	async getSessionProfileRows(userId: string) { const u = this.users.get(userId); return u ? [{ nick: u.nick, avatar: 0, avatarUrl: "", email: u.email }] : []; }
}

class InMemoryInviteRepository implements Partial<UserInviteRepository> {
	codes = new Map<string, IInviteInfo>();
	consumed: string[] = [];
	records: any[] = [];
	added: any[] = [];
	async hasInviteCode(code: string) { return this.codes.has(code); }
	async getInviteInfoByInviteCode(code: string) { return this.codes.get(code) || null; }
	async consumeInviteCode(code: string) { this.consumed.push(code); }
	async deleteInviteRecord() { }
	async addInviteRecord(code: string, inviter: string, userId: string) { this.records.push({ code, inviter, userId }); }
	async addInviteCode(userId: string, expireDate: string, n: number) { this.added.push({ userId, expireDate, n }); return "uuid-1"; }
}

describe("user 领域用例（经控制器）", function () {
	let previous: any[];
	let users: InMemoryUserRepository;
	let invites: InMemoryInviteRepository;

	beforeEach(() => {
		previous = [boundImpl(userRepository), boundImpl(userInviteRepository), boundImpl(userBanRepository)];
		users = new InMemoryUserRepository();
		invites = new InMemoryInviteRepository();
		bindPort(userRepository, users as any);
		bindPort(userInviteRepository, invites as any);
	});
	afterEach(() => {
		bindPort(userRepository, previous[0]);
		bindPort(userInviteRepository, previous[1]);
		bindPort(userBanRepository, previous[2]);
	});

	it("邀请码注册：校验、消耗邀请码、记录邀请人、写入用户（密码加密、记录 IP）", async () => {
		invites.codes.set("code1", { invite_id: 1, user_id: "inviter", invite_code: "code1", valid_date: "", valid_time: 1 });
		const req: any = { body: { userId: "newbie", nick: "N", password: "123456", confirmQuestion: "q", confirmAnswer: "a", inviteCode: "code1" }, headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" }, connection: {} };
		await RegisterController.register(req);
		expect(invites.consumed).to.deep.equal(["code1"]);
		expect(invites.records).to.deep.equal([{ code: "code1", inviter: "inviter", userId: "newbie" }]);
		const user = users.users.get("newbie");
		expect(user.ip).to.equal("1.2.3.4");
		expect(decryptPassword(user.newpassword, salt)).to.equal("123456");
		expect(decryptPassword(user.confirmanswer, salt)).to.equal("a");
	});

	it("邀请码注册：报错文案不变", async () => {
		users.users.set("taken", { user_id: "taken" });
		const base = { nick: "N", password: "123456", confirmQuestion: "q", confirmAnswer: "a", inviteCode: "none" };
		const reg = (body: any) => RegisterController.register({ body, headers: {}, connection: { remoteAddress: "127.0.0.1" } } as any);
		let err: any = null;
		await reg(Object.assign({}, base, { userId: "taken" })).catch(e => err = e);
		expect(err.message).to.equal("UserId has been registered");
		await reg(Object.assign({}, base, { userId: "ab" })).catch(e => err = e);
		expect(err.message).to.equal("UserId could not shorter than 3");
		await reg(Object.assign({}, base, { userId: "fresh" })).catch(e => err = e);
		expect(err.message).to.equal("Invite code does not exist");
	});

	it("找回密码：验证码错误、密保答案错误、成功重置", async () => {
		users.users.set("u1", { user_id: "u1", confirmquestion: "q?", confirmanswer: encryptPassword("ans", salt) });
		expect(await LostPasswordController.getConfirmQuestion({ params: { user_id: "u1" } } as any)).to.deep.equal({ status: "OK", data: "q?" });
		const session = { captcha: { from: "lost", captcha: "AbC" } };
		const bad: any = await LostPasswordController.resetPassword({ session: { captcha: { from: "register", captcha: "abc" } }, body: { captcha: "abc", userId: "u1" } } as any);
		expect(bad.status).to.equal("error");
		expect(await LostPasswordController.resetPassword({ session, body: { captcha: "abc", userId: "u1", confirmAnswer: "wrong", password: "p" } } as any))
			.to.deep.equal({ status: "error", statement: "Confirm answer is wrong" });
		expect(await LostPasswordController.resetPassword({ session, body: { captcha: "abc", userId: "u1", confirmAnswer: "ans", password: "newpass" } } as any))
			.to.deep.equal({ status: "OK", data: undefined });
		expect(users.changed).to.have.length(1);
		expect(users.changed[0][0]).to.equal("u1");
		expect(decryptPassword(users.changed[0][1], salt)).to.equal("newpass");
	});

	it("邀请码管理：校验文案与正常新增", async () => {
		const session = { user_id: "admin" };
		expect(await InviteController.addInviteCode({ session, body: { expireDate: "2000-01-01", validUserNumber: 3 } } as any))
			.to.deep.equal({ status: "error", statement: "Expire date should after now" });
		expect(await InviteController.addInviteCode({ session, body: { expireDate: "2999-01-01", validUserNumber: 0 } } as any))
			.to.deep.equal({ status: "error", statement: "Valid user number should larger than 0" });
		expect(await InviteController.addInviteCode({ session, body: { expireDate: "2999-01-01", validUserNumber: "3" } } as any))
			.to.deep.equal({ status: "OK", data: "uuid-1" });
		expect(invites.added).to.deep.equal([{ userId: "admin", expireDate: "2999-01-01 00:00:00", n: 3 }]);
	});

	it("用户邮箱：不存在时返回空串", async () => {
		users.users.set("u2", { user_id: "u2", email: "a@b.c" });
		expect(await UserController.getUserEmail({ params: { user_id: "u2" } } as any)).to.deep.equal({ status: "OK", data: "a@b.c" });
		expect(await UserController.getUserEmail({ params: { user_id: "nobody" } } as any)).to.deep.equal({ status: "OK", data: "" });
	});

	it("登录动作：按权限串写 session", async () => {
		users.users.set("u3", { user_id: "u3", nick: "Nick3", email: "e" });
		users.privileges = [{ user_id: "u3", rightstr: "administrator" }, { user_id: "u3", rightstr: "c1001" }];
		const req: any = { session: {} };
		await loginAction(req, "u3");
		expect(req.session).to.include({ auth: true, isadmin: true, editor: false, user_id: "u3", nick: "Nick3", email: "e" });
		expect(req.session.contest).to.deep.equal({ c1001: true });
	});

	it("封禁列表：补上昵称", async () => {
		users.users.set("bad", { user_id: "bad", nick: "BadGuy" });
		const fakeBan: Partial<UserBanRepository> = { getAll: async () => [{ user_id: "bad", bantime: "2099-01-01" }, { user_id: "ghost", bantime: "2099-01-02" }] };
		bindPort(userBanRepository, fakeBan as any);
		expect(await BanModel.getAllByRequest()).to.deep.equal({
			status: "OK",
			data: [{ nick: "BadGuy", user_id: "bad", bantime: "2099-01-01" }, { nick: "", user_id: "ghost", bantime: "2099-01-02" }]
		});
	});
});
