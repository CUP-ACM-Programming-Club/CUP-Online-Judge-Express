
import { expect } from "chai";
import { ConfigService } from "../../service/ConfigService";

describe("ConfigService Tests", function () {
    let configService: ConfigService;
    let originalConfig: any;

    beforeEach(function () {
        configService = new ConfigService();
        // Backup global.config
        // @ts-ignore
        originalConfig = global.config;
        // @ts-ignore
        global.config = {
            key: "value",
            nested: {
                prop: "propValue"
            },
            switch: {
                featureX: true
            }
        };
    });

    afterEach(function () {
        // Restore global.config
        // @ts-ignore
        global.config = originalConfig;
    });

    it("should get entire config", () => {
        expect(configService.config).to.have.property("key", "value");
    });

    it("should get specific key", () => {
        expect(configService.get("key")).to.equal("value");
    });

    it("should return default value if key missing", () => {
        expect(configService.get("missing", "default")).to.equal("default");
    });

    it("should return undefined if key missing and no default", () => {
        expect(configService.get("missing")).to.be.undefined;
    });

    it("should get switch value", () => {
        expect(configService.getSwitch("featureX")).to.be.true;
    });

    it("should return undefined if switch block missing", () => {
        // @ts-ignore
        global.config.switch = undefined;
        expect(configService.getSwitch("featureX")).to.be.undefined;
    });
});
