import { expect } from "chai";
import crypto from "crypto";
import { redactRow, redactRows, gravatarEmailHash, isContestSensitivePrivileged, SUBMISSION_SENSITIVE_FIELDS } from "../../utils/privacy";

const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex");

describe("privacy utils", function () {
    const row = { user_id: "alice", solution_id: 1, ip: "10.0.0.1", fingerprint: "f", fingerprintRaw: "fr", email: " Alice@Example.COM " };

    it("gravatarEmailHash matches vue-gravatar: md5(trim(lowercase))", function () {
        expect(gravatarEmailHash(" Alice@Example.COM ")).to.equal(md5("alice@example.com"));
        expect(gravatarEmailHash("")).to.equal("");
        expect(gravatarEmailHash(null)).to.equal("");
        expect(gravatarEmailHash(undefined)).to.equal("");
    });

    it("strips sensitive fields and email for a non-privileged viewer on others' rows", function () {
        const out: any = redactRow(row, { privileged: false, viewerId: "bob", fields: SUBMISSION_SENSITIVE_FIELDS, hashEmail: true });
        expect(out).to.not.have.any.keys("ip", "fingerprint", "fingerprintRaw", "email");
        expect(out.email_hash).to.equal(md5("alice@example.com"));
        expect(out.solution_id).to.equal(1);
    });

    it("keeps everything for privileged viewers (plus email_hash)", function () {
        const out: any = redactRow(row, { privileged: true, viewerId: "bob", fields: SUBMISSION_SENSITIVE_FIELDS, hashEmail: true });
        expect(out.ip).to.equal("10.0.0.1");
        expect(out.fingerprint).to.equal("f");
        expect(out.fingerprintRaw).to.equal("fr");
        expect(out.email).to.equal(row.email);
        expect(out.email_hash).to.equal(md5("alice@example.com"));
    });

    it("keeps the owner's own row", function () {
        const out: any = redactRow(row, { privileged: false, viewerId: "alice", fields: SUBMISSION_SENSITIVE_FIELDS, hashEmail: true });
        expect(out.ip).to.equal("10.0.0.1");
        expect(out.email).to.equal(row.email);
    });

    it("anonymous viewer is never treated as owner", function () {
        const out: any = redactRow(row, { privileged: false, viewerId: undefined, fields: SUBMISSION_SENSITIVE_FIELDS });
        expect(out).to.not.have.any.keys("ip", "fingerprint", "fingerprintRaw");
        // hashEmail not requested: email untouched
        expect(out.email).to.equal(row.email);
        expect(out).to.not.have.key("email_hash");
    });

    it("never mutates the input rows (they can be shared cache objects)", function () {
        const input = [Object.assign({}, row)];
        const snapshot = JSON.stringify(input);
        redactRows(input, { privileged: false, viewerId: "bob", fields: SUBMISSION_SENSITIVE_FIELDS, hashEmail: true });
        expect(JSON.stringify(input)).to.equal(snapshot);
    });

    it("isContestSensitivePrivileged follows admin / contest_manager / contest_maker[m+cid]", function () {
        expect(isContestSensitivePrivileged({ isadmin: true }, 1000)).to.equal(true);
        expect(isContestSensitivePrivileged({ contest_manager: true }, 1000)).to.equal(true);
        expect(isContestSensitivePrivileged({ contest_maker: { m1000: true } }, 1000)).to.equal(true);
        expect(isContestSensitivePrivileged({ contest_maker: { m1000: true } }, "1000")).to.equal(true);
        expect(isContestSensitivePrivileged({ contest_maker: { m1001: true } }, 1000)).to.equal(false);
        expect(isContestSensitivePrivileged({ contest: { c1000: true } }, 1000)).to.equal(false);
        expect(isContestSensitivePrivileged(undefined, 1000)).to.equal(false);
    });
});
