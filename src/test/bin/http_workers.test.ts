import { expect } from "chai";
import { resolveHttpWorkers } from "../../main/init/http_workers";

describe("resolveHttpWorkers", function () {
    it("defaults to 8 when neither env nor config is set", function () {
        expect(resolveHttpWorkers({}, {}, 64)).to.deep.equal({ count: 8, source: "default" });
        expect(resolveHttpWorkers({}, undefined, 64)).to.deep.equal({ count: 8, source: "default" });
    });

    it("uses config.http_workers when env is absent", function () {
        expect(resolveHttpWorkers({}, { http_workers: 12 }, 64)).to.deep.equal({ count: 12, source: "config" });
        expect(resolveHttpWorkers({}, { http_workers: "6" }, 64)).to.deep.equal({ count: 6, source: "config" });
    });

    it("prefers KC_HTTP_WORKERS over config", function () {
        expect(resolveHttpWorkers({ KC_HTTP_WORKERS: "4" }, { http_workers: 12 }, 64))
            .to.deep.equal({ count: 4, source: "env" });
    });

    it("ignores invalid values and falls through", function () {
        for (const bad of ["0", "-3", "abc", "2.5", ""]) {
            expect(resolveHttpWorkers({ KC_HTTP_WORKERS: bad }, { http_workers: 10 }, 64))
                .to.deep.equal({ count: 10, source: "config" });
        }
        expect(resolveHttpWorkers({}, { http_workers: 0 }, 64)).to.deep.equal({ count: 8, source: "default" });
        expect(resolveHttpWorkers({}, { http_workers: "x" }, 64)).to.deep.equal({ count: 8, source: "default" });
    });

    it("caps at 32", function () {
        expect(resolveHttpWorkers({ KC_HTTP_WORKERS: "100" }, {}, 64).count).to.equal(32);
        expect(resolveHttpWorkers({}, { http_workers: 64 }, 64).count).to.equal(32);
    });

    it("never exceeds the CPU count (keeps the old min(cpus, ...) behaviour)", function () {
        expect(resolveHttpWorkers({}, {}, 4).count).to.equal(4);
        expect(resolveHttpWorkers({ KC_HTTP_WORKERS: "16" }, {}, 2).count).to.equal(2);
    });
});
