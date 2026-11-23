/**
 * base64Image 单元测试：校验与原 base64-img@1.0.4 的行为一致
 */
import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { imageFileToDataUri, dataUriToImageFile } from "../../module/util/base64Image";

describe("base64Image (base64-img replacement)", function () {
    let dir: string;
    const payload = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0xff]);

    beforeEach(function () {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), "b64img-"));
    });

    afterEach(function () {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it("imageFileToDataUri uses the raw extension as MIME subtype", async function () {
        const cases: [string, string][] = [["a.png", "png"], ["b.JPG", "JPG"], ["c.jpeg", "jpeg"], ["d.svg", "svg+xml"], ["noext", "png"]];
        for (const [name, subtype] of cases) {
            const file = path.join(dir, name);
            fs.writeFileSync(file, payload);
            expect(await imageFileToDataUri(file)).to.equal(`data:image/${subtype};base64,${payload.toString("base64")}`);
        }
    });

    it("imageFileToDataUri rejects for a missing file", async function () {
        let error: any;
        try {
            await imageFileToDataUri(path.join(dir, "missing.png"));
        } catch (e) {
            error = e;
        }
        expect(error).to.be.instanceOf(Error);
    });

    it("dataUriToImageFile maps MIME subtype to extension and creates the directory", async function () {
        const cases: [string, string][] = [["jpeg", ".jpg"], ["svg+xml", ".svg"], ["png", ".png"], ["gif", ".gif"]];
        for (const [subtype, ext] of cases) {
            const dest = path.join(dir, "nested", subtype.replace("+", "_"));
            const file = await dataUriToImageFile(`data:image/${subtype};base64,${payload.toString("base64")}`, dest, "1");
            expect(file).to.equal(path.join(dest, "1" + ext));
            expect(fs.readFileSync(file).equals(payload)).to.be.true;
        }
    });

    it("dataUriToImageFile round-trips with imageFileToDataUri", async function () {
        const src = path.join(dir, "x.png");
        fs.writeFileSync(src, payload);
        const file = await dataUriToImageFile(await imageFileToDataUri(src), path.join(dir, "out"), "y");
        expect(fs.readFileSync(file).equals(payload)).to.be.true;
    });

    it("dataUriToImageFile rejects malformed data", async function () {
        let error: any;
        try {
            await dataUriToImageFile("not a data uri", dir, "x");
        } catch (e) {
            error = e;
        }
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal("image base64 data error");
    });
});
