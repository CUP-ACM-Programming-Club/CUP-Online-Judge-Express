const expect = require("chai").expect;
const request = require("supertest");
const path = require("path");
const fs = require("fs");
const query = require("../../module/mysql_cache");

describe("system router extra", function () {
	let server;
	const compilePath = path.join(__dirname, "..", "fixtures", "compile.json");

	before(async function () {
		server = require("../../app").default || require("../../app");
		require("../../module/init/build_env")(true);
		require("../../module/init/express_loader")(server);
		fs.writeFileSync(compilePath, JSON.stringify({ 0: ["-O2"] }), "utf8");
		global.config.etc = global.config.etc || {};
		global.config.etc.compile_arguments = compilePath;
		await query("insert into users (user_id,password) values(?,?)",
			["admin", "ZNs/zvia7mVswcknwoXWOiuNwJUyMDg1"]);
		await query("insert into privilege (user_id,rightstr) values(?,?)", ["admin", "administrator"]);
		await new Promise((done) => {
			let data = { user_id: "admin", password: "123456" };
			request(server)
				.post("/login")
				.send({
					msg: Buffer.from(Buffer.from(JSON.stringify(data)).toString("base64")).toString("base64")
				})
				.end(function () { done(); });
		});
	});

	it("should return version info", function (done) {
		request(server)
			.get("/system/config/version_control/version")
			.expect(200)
			.end(function (err, res) {
				if (err) {
					done(err);
				}
				expect(res.body).to.have.property("status").that.equal("OK");
				done();
			});
	});

	it("should return git info and dependencies", function (done) {
		request(server)
			.get("/system/config/version_control/git")
			.expect(200)
			.end(function (err, res) {
				if (err) {
					done(err);
				}
				expect(res.body).to.have.property("status").that.equal("OK");
				request(server)
					.get("/system/config/version_control/dependencies")
					.expect(200)
					.end(function (err2, res2) {
						if (err2) {
							done(err2);
						}
						expect(res2.body).to.have.property("status").that.equal("OK");
						request(server)
							.get("/system/config/version_control/devDependencies")
							.expect(200)
							.end(function (err3, res3) {
								if (err3) {
									done(err3);
								}
								expect(res3.body).to.have.property("status").that.equal("OK");
								done();
							});
					});
			});
	});

	it("should return error when version info fails", async function () {
		const VersionManager = require("../../manager/system/VersionManager").default;
		const originalVersion = Object.getOwnPropertyDescriptor(VersionManager, "version");

		Object.defineProperty(VersionManager, "version", {
			get: () => { throw new Error("mock error"); },
			configurable: true
		});

		await request(server)
			.get("/system/config/version_control/version")
			.expect(200)
			.then(res => {
				Object.defineProperty(VersionManager, "version", originalVersion);
				expect(res.body).to.deep.equal(require("../../module/constants/state").error.internalError);
			})
			.catch(err => {
				Object.defineProperty(VersionManager, "version", originalVersion);
				throw err;
			});
	});

	it("should return error when git info fails", async function () {
		const VersionManager = require("../../manager/system/VersionManager").default;
		const originalGit = Object.getOwnPropertyDescriptor(VersionManager, "git");
		Object.defineProperty(VersionManager, "git", {
			get: () => { throw new Error("mock error"); },
			configurable: true
		});
		await request(server)
			.get("/system/config/version_control/git")
			.expect(200)
			.then(res => {
				Object.defineProperty(VersionManager, "git", originalGit);
				expect(res.body).to.deep.equal(require("../../module/constants/state").error.internalError);
			})
			.catch(err => {
				Object.defineProperty(VersionManager, "git", originalGit);
				throw err;
			});
	});

	it("should return error when dependencies info fails", async function () {
		const VersionManager = require("../../manager/system/VersionManager").default;
		const originalDependencies = Object.getOwnPropertyDescriptor(VersionManager, "dependencies");
		Object.defineProperty(VersionManager, "dependencies", {
			get: () => { throw new Error("mock error"); },
			configurable: true
		});
		await request(server)
			.get("/system/config/version_control/dependencies")
			.expect(200)
			.then(res => {
				Object.defineProperty(VersionManager, "dependencies", originalDependencies);
				expect(res.body).to.deep.equal(require("../../module/constants/state").error.internalError);
			})
			.catch(err => {
				Object.defineProperty(VersionManager, "dependencies", originalDependencies);
				throw err;
			});
	});

	it("should return error when devDependencies info fails", async function () {
		const VersionManager = require("../../manager/system/VersionManager").default;
		const originalDevDependencies = Object.getOwnPropertyDescriptor(VersionManager, "devDependencies");
		Object.defineProperty(VersionManager, "devDependencies", {
			get: () => { throw new Error("mock error"); },
			configurable: true
		});
		await request(server)
			.get("/system/config/version_control/devDependencies")
			.expect(200)
			.then(res => {
				Object.defineProperty(VersionManager, "devDependencies", originalDevDependencies);
				expect(res.body).to.deep.equal(require("../../module/constants/state").error.internalError);
			})
			.catch(err => {
				Object.defineProperty(VersionManager, "devDependencies", originalDevDependencies);
				throw err;
			});
	});

	it("should return compile arguments", function (done) {
		request(server)
			.get("/system/judge/compile")
			.expect(200)
			.end(function (err, res) {
				if (err) {
					done(err);
				}
				expect(res.body).to.have.property("status").that.equal("OK");
				done();
			});
	});

	it("should return login logs with admin session", function (done) {
		const agent = request.agent(server);
		let data = { user_id: "admin", password: "123456" };
		agent
			.post("/login")
			.send({
				msg: Buffer.from(Buffer.from(JSON.stringify(data)).toString("base64")).toString("base64")
			})
			.expect(200)
			.end(function () {
				agent
					.get("/system/log/login/latest")
					.expect(200)
					.end(function (err, res) {
						if (err) {
							done(err);
						}
						expect(res.body).to.have.property("status").that.equal("OK");
						agent
							.get("/system/log/login/user/admin")
							.expect(200)
							.end(function (err2, res2) {
								if (err2) {
									done(err2);
								}
								expect(res2.body).to.have.property("status").that.equal("OK");
								done();
							});
					});
			});
	});

	after(async function () {
		await query("delete from users where user_id = 'admin'");
	});
});
