const expect = require("chai").expect;
const configModule = require("../../../module/config/config-manager");
const { SystemConfigManager, ConfigManager } = configModule;
const ErrorCollector = require("../../../module/error/collector");

describe("ConfigManager", function () {
	it("should set/get/remove config values", function () {
		ConfigManager.setConfig("k1", "{\"a\":1}");
		const value = ConfigManager.getConfig("k1", null);
		expect(value).to.deep.equal({ a: 1 });
		ConfigManager.removeConfig("k1");
		expect(ConfigManager.getConfig("k1", null)).to.equal(null);
	});

	it("should return default when JSON parse fails", function () {
		ConfigManager.setConfig("bad", "{");
		const value = ConfigManager.getJSONConfig("bad", "fallback");
		expect(value).to.equal("fallback");
		expect(ErrorCollector.getAllError()).to.be.an("object");
	});

	it("should set and evaluate switches", function () {
		ConfigManager.setSwitch("switch_on", 100);
		const originalRandom = ConfigManager.getRandom;
		ConfigManager.getRandom = () => 50;
		expect(ConfigManager.isSwitchedOn("switch_on", 0)).to.equal(true);
		ConfigManager.setSwitch("switch_off", 0);
		expect(ConfigManager.isSwitchedOn("switch_off", 100)).to.equal(false);
		ConfigManager.getRandom = originalRandom;
	});

	it("should ignore invalid switches", function () {
		ConfigManager.setSwitch("bad_switch", "invalid");
		expect(ConfigManager.getSwitch("bad_switch")).to.equal(null);
	});

	it("should remove switches", function () {
		ConfigManager.setSwitch("switch_remove", 100);
		ConfigManager.removeSwitch("switch_remove");
		expect(ConfigManager.getSwitch("switch_remove")).to.equal(null);
	});

	it("should support persistence modules", function () {
		const manager = new SystemConfigManager();
		let configSetCalled = false;
		let switchSetCalled = false;
		manager.setConfigPersistenceModule({ set: () => { configSetCalled = true; } });
		manager.setSwitchPersistenceModule({ set: () => { switchSetCalled = true; } });
		manager.setConfig("p1", "v1");
		manager.setSwitch("p2", 10);
		expect(configSetCalled).to.equal(true);
		expect(switchSetCalled).to.equal(true);
	});

	it("should init maps from store", async function () {
		const manager = new SystemConfigManager();
		let setCalled = false;
		const store = {
			getAll: () => Promise.resolve([{ key: "c1", value: "v1", comment: "x" }])
		};
		const originalInterval = global.setInterval;
		global.setInterval = () => 0;
		await manager.baseMapInitHandler(store, function (key, value) {
			setCalled = true;
			this.__data__.configMap[key] = { value };
		});
		global.setInterval = originalInterval;
		expect(setCalled).to.equal(true);
		expect(manager.getConfig("c1", null)).to.equal("v1");
	});

	it("should use store factories", function () {
		const manager = new SystemConfigManager();
		manager.useMySQLStore();
		manager.useRedisStore();
	});

	it("should get array/object configs", function () {
		expect(ConfigManager.getArrayConfig("arr", "[1,2]")).to.deep.equal([1, 2]);
		expect(ConfigManager.getObjectConfig("obj", "{\"x\":1}")).to.deep.equal({ x: 1 });
	});

	it("should init config and switch maps via init helpers", async function () {
		const manager = new SystemConfigManager();
		const originalInterval = global.setInterval;
		global.setInterval = (fn) => {
			fn();
			return 0;
		};
		manager.setConfigPersistenceModule({
			getAll: () => Promise.resolve([{ key: "cfg", value: "v" }])
		});
		manager.setSwitchPersistenceModule({
			getAll: () => Promise.resolve([{ key: "sw", value: "1" }])
		});
		await manager.initConfigMap();
		await manager.initSwitchMap();
		global.setInterval = originalInterval;
		expect(manager.getConfig("cfg", null)).to.equal("v");
		expect(manager.getSwitch("sw")).to.deep.equal({ value: 1, comment: undefined });
	});
	it("should handle removeConfig/Switch for non-existing keys", function () {
		const manager = new SystemConfigManager();
		manager.removeConfig("non_exist");
		manager.removeSwitch("non_exist");
		// Should not throw
	});

	it("should return default if config not set", function () {
		const manager = new SystemConfigManager();
		expect(manager.getConfig("unk", "def")).to.equal("def");
	});

	it("should fallback to random if switch config invalid", function () {
		const manager = new SystemConfigManager();
		// wrappedValue undefined
		const originalRandom = manager.getRandom;
		manager.getRandom = () => 50;
		expect(manager.isSwitchedOn("unk", 49)).to.equal(false); // 50 <= 49 false
		expect(manager.isSwitchedOn("unk", 51)).to.equal(true); // 50 <= 51 true
		manager.getRandom = originalRandom;
	});

	it("should handle persistence calls without modules safely", function () {
		const manager = new SystemConfigManager();
		manager.configPersistence({});
		manager.switchPersistence({});
		manager.configRemove("k");
		manager.switchRemove("k");
		// Should not throw
	});

	it("should handle cluster messages", function (done) {
		const cluster = require("cluster");
		const originalIsMaster = cluster.isMaster;
		cluster.isMaster = false;

		const manager = new SystemConfigManager();
		let setConfigCalledArgs = null;
		manager.setConfigWithoutStore = function (...args) {
			setConfigCalledArgs = args;
		};

		// Simulate process.on logic
		// We can't easily emit on real process, but we can verify code logic by visual inspection or stubbing logic if we could inject it.
		// Actually, clusterHandler uses `process.on`.
		// We can mock process.on temporarily?
		const originalOn = process.on;
		const listeners = {};
		process.on = (evt, fn) => {
			listeners[evt] = fn;
			return process;
		};

		// Re-call clusterHandler to attach listener with mocked process.on
		manager.clusterHandler({ "setConfig": manager.setConfigWithoutStore });

		if (listeners["message"]) {
			listeners["message"]({
				configManager: true,
				method: "setConfig",
				args: ["k", "v"]
			});
			expect(setConfigCalledArgs).to.deep.equal(["k", "v"]);

			// Branch: data.configManager false
			setConfigCalledArgs = null;
			listeners["message"]({ configManager: false });
			expect(setConfigCalledArgs).to.equal(null);
		}

		process.on = originalOn;
		cluster.isMaster = originalIsMaster;
		done();
	});

	it("should broadcast setters", function (done) {
		const manager = new SystemConfigManager();
		const originalSend = process.send;
		let sentPayload = null;
		process.send = (payload) => {
			sentPayload = payload;
		};

		manager.boardcastSetConfig("k", "v");
		expect(sentPayload).to.deep.include({ method: "setConfig", args: ["k", "v"] });

		process.send = originalSend;
		done();
	});
	it("should handle removeConfig/Switch safely", function () {
		const manager = new SystemConfigManager();
		// Mock persistence modules
		let configRemoteRemove = false;
		let switchRemoteRemove = false;
		manager.setConfigPersistenceModule({ remove: () => configRemoteRemove = true, set: () => { } });
		manager.setSwitchPersistenceModule({ remove: () => switchRemoteRemove = true, set: () => { } });

		manager.setConfig("c1", "v1");
		manager.setSwitch("s1", 1);

		manager.removeConfig("c1");
		expect(configRemoteRemove).to.equal(true);
		expect(manager.getConfig("c1", null)).to.equal(null);

		manager.removeSwitch("s1");
		expect(switchRemoteRemove).to.equal(true);
		expect(manager.getSwitch("s1")).to.equal(null);

		// Remove non-exist
		configRemoteRemove = false;
		manager.removeConfig("unknown");
		expect(configRemoteRemove).to.equal(false);
	});

	it("should get config map and switch map", function () {
		const manager = new SystemConfigManager();
		manager.setConfig("c", "v");
		manager.setSwitch("s", 1);
		expect(manager.getConfigMap()).to.have.property("c");
		expect(manager.getSwitchMap()).to.have.property("s");
	});

	it("should handle getJSONConfig default", function () {
		const manager = new SystemConfigManager();
		expect(manager.getJSONConfig("unknown", { a: 1 })).to.deep.equal({ a: 1 });
	});
});
