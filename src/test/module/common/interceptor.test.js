import {ConfigInterceptor} from "../../../module/common/interceptor";
const expect = require("chai").expect;
const {ConfigManager} = require("../../../module/config/config-manager");
const sequelize = require("../../../orm/instance/sequelize");
const {error} = require("../../../module/constants/state");
const {isAdministrator} = require("../../../module/account/privilege");

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

    after(async function() {
        sequelize.close();
        require("../../../module/redis").quit();
    });
});
