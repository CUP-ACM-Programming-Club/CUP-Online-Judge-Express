/**
 * WebSocket 身份：UserValidatorMiddleware 决定 socket.user_id。
 */
import "../setup/mock-external";
import { expect } from "chai";
import userValidator from "../../module/websocket/UserValidatorMiddleware";

function run(cookie: string | undefined, session: any): Promise<{ socket: any, err: any }> {
	const socket: any = { handshake: { headers: { cookie } }, request: { session } };
	return new Promise(resolve => {
		userValidator(socket, (err?: any) => resolve({ socket, err }));
	});
}

describe("WebSocket 身份（UserValidatorMiddleware）", function () {
	it("有登录 session、无 user_id cookie：取 session 的 user_id", async function () {
		const { socket, err } = await run("foo=bar", { user_id: "pm_student" });
		expect(err).to.equal(undefined);
		expect(socket.user_id).to.equal("pm_student");
		expect(socket.auth).to.equal(true);
	});

	it("有登录 session 时 user_id cookie 覆盖 session（现状：可冒充）", async function () {
		const { socket, err } = await run("user_id=pm_admin", { user_id: "pm_student" });
		expect(err).to.equal(undefined);
		expect(socket.user_id).to.equal("pm_admin");
	});

	it("无 session：cookie user_id + 有效 token 通过", async function () {
		// mock redis 的 lrangeAsync 恒返回 ["test"]
		const { socket, err } = await run("user_id=pm_student; token=test", {});
		expect(err).to.equal(undefined);
		expect(socket.user_id).to.equal("pm_student");
		expect(socket.auth).to.equal(true);
	});

	it("无 session：token 无效拒绝", async function () {
		const { err } = await run("user_id=pm_student; token=bad; newToken=bad", {});
		expect(err).to.be.instanceOf(Error);
		expect(err.message).to.equal("Token Expired.");
	});

	it("无 session、无 user_id：拒绝", async function () {
		const { err } = await run("foo=bar", {});
		expect(err.message).to.equal("Auth failed");
	});

	it("没有 cookie 头：拒绝", async function () {
		const { err } = await run(undefined, { user_id: "pm_student" });
		expect(err.message).to.equal("cookie invalid");
	});
});
