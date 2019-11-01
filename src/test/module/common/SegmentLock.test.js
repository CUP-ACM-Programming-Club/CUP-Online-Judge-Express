const expect = require("chai").expect;
const SegmentLock = require("../../../module/common/SegmentLock");
describe("SegmentLock tester", function () {
    it("should release all lock", async function (done) {
        const lock = new SegmentLock();
        await lock.getLock("1");
        lock.release("1");
        lock.release("1");
        done();
    });
});
