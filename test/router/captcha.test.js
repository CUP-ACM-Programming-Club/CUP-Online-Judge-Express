const expect = require("chai").expect;
const query = require("../../module/mysql_cache");

async function removeAll() {
	await query("delete from users where user_id = 'test' or nick = 'test' or nick = 'test1'");
}

function afterAll() {
	require("../../module/mysql_cache").pool.end();
	require("../../module/mysql_query").pool.end();
	require("../../module/redis").quit();
}

describe("test captcha", function(){
	let server;
	server = require("../../app");
	require("../../module/init/build_env")(true);
	require("../../module/init/express_loader")(server);
	const request = require("supertest").agent(server);
	before(async function(){
		await removeAll();
		await query("insert into users (user_id,password) values(?,?)",
			["test", "ZNs/zvia7mVswcknwoXWOiuNwJUyMDg1"]);
		await new Promise((done) => {
			let data = {
				user_id: "test",
				password: "123456"
			};
			request
				.post("/login")
				.send({
					msg: Buffer.from(Buffer.from(JSON.stringify(data)).toString("base64")).toString("base64")
				})
				.expect(200)
				.end(function (err, res) {
					if (err) {
						done(err);
					}
					done();
				})
		});
	});

	it("should receive string content which is svg image", function (done) {
		request.get("/captcha")
			.expect(200)
			.end(function(err, res) {
				expect(res.type).to.equal("image/svg+xml");
				expect(res.body).to.be.instanceof(Buffer);
				done();
			})
	});

	after(async function() {
		await afterAll();
		await removeAll();
	})
});
