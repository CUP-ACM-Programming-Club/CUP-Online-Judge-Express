import {ConfigInterceptor} from "../../../interfaces/http/interceptor/interceptor";
const expect = require("chai").expect;
const {ConfigManager} = require("../../../infrastructure/config/config-manager");
const sequelize = require("../../../infrastructure/orm/instance/sequelize");
const {error} = require("../../../domain/constants/state");
const {isAdministrator} = require("../../../interfaces/http/privilege");

describe("ConfigManager Interceptor Factory", function () {
    it('should call next() when Switch is on', function (done) {
        const interceptor = ConfigInterceptor.newInstance().setSwitchKey("test_switch").setDefaultValue(ConfigManager.SWITCH_ON).build();
        ConfigManager.setSwitch("test_switch", 100);
        interceptor(null, null, done);
    });

    it('should not call next() but call res.json', function (done) {
        const interceptor = ConfigInterceptor.newInstance().setSwitchKey("test_switch").setDefaultValue(ConfigManager.SWITCH_ON).build();
        ConfigManager.setSwitch("test_switch", 0);
        interceptor(null, {json: e => expect(e).to.deep.equal(error.unavailable) && done()}, () => {});
    });

    it('should not call next() because of next is not a function', function (done) {
        const interceptor = ConfigInterceptor.newInstance().setSwitchKey("test_switch").setDefaultValue(ConfigManager.SWITCH_ON).build();
        ConfigManager.setSwitch("test_switch", 100);
        interceptor(null, {json: e => expect(e).to.deep.equal(error.unavailable) && done()}, null);
    });

    it('should pass validate because user is admin', function (done) {
        const interceptor = ConfigInterceptor.newInstance()
            .setSwitchKey("test_switch")
            .setAdditionalValidator(isAdministrator)
            .setDefaultValue(ConfigManager.SWITCH_ON)
            .build();
        ConfigManager.setSwitch("test_switch", 0);
        interceptor({session: {isadmin: true}}, null, done);
    });

    it("should expose config interceptor setters and getters", function () {
        const interceptor = ConfigInterceptor.newInstance()
            .setSwitchKey("k1")
            .setDefaultValue(ConfigManager.SWITCH_OFF)
            .setErrorResponse({custom: true});
        expect(interceptor.getSwitchKey()).to.equal("k1");
        expect(interceptor.getDefaultValue()).to.equal(ConfigManager.SWITCH_OFF);
        expect(interceptor.getErrorResponse()).to.deep.equal({custom: true});
        const middleware = interceptor.build();
        let payload;
        middleware({}, {json: data => { payload = data; }}, () => {});
        expect(payload).to.have.property("custom").that.equal(true);
    });

    after(async function() {
        sequelize.close();
        require("../../../infrastructure/redis/redis").quit();
    });
});
