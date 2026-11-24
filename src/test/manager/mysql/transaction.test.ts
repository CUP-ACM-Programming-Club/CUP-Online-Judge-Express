import { expect } from "chai";
import { openTransaction } from "../../../manager/mysql/transaction";

type Behaviour = (sql: string) => Error | null;

function createFakePool(opts: { getConnectionError?: Error; behaviour?: Behaviour } = {}) {
    const log: string[] = [];
    const connection: any = {
        threadId: 42,
        query(sql: string, binding: any, cb: any) {
            if (typeof binding === "function") {
                cb = binding;
            }
            log.push(sql);
            const err = opts.behaviour ? opts.behaviour(sql) : null;
            setImmediate(() => (err ? cb(err) : cb(null, { insertId: 1 })));
        },
        release() {
            log.push("<release>");
        },
        destroy() {
            log.push("<destroy>");
        }
    };
    const pool = {
        getConnection(cb: any) {
            setImmediate(() => (opts.getConnectionError ? cb(opts.getConnectionError) : cb(null, connection)));
        }
    };
    return { pool, log, connection };
}

describe("MySQL transaction (openTransaction)", function () {
    it("sends START TRANSACTION before handing out the connection", async function () {
        const { pool, log } = createFakePool();
        await openTransaction(pool);
        expect(log).to.deep.equal(["START TRANSACTION"]);
    });

    it("BEGIN -> query -> COMMIT -> release, connection released exactly once", async function () {
        const { pool, log } = createFakePool();
        const tx = await openTransaction(pool);
        await tx.query("insert into t values(?)", [1]);
        await tx.query("COMMIT");
        await tx.release();
        await tx.release();
        expect(log).to.deep.equal(["START TRANSACTION", "insert into t values(?)", "COMMIT", "<release>"]);
    });

    it("BEGIN -> ROLLBACK -> release does not roll back twice", async function () {
        const { pool, log } = createFakePool();
        const tx = await openTransaction(pool);
        await tx.query("ROLLBACK");
        await tx.release();
        expect(log).to.deep.equal(["START TRANSACTION", "ROLLBACK", "<release>"]);
    });

    it("rolls back an unfinished transaction on release before returning it to the pool", async function () {
        const { pool, log } = createFakePool();
        const tx = await openTransaction(pool);
        await tx.query("insert into t values(?)", [1]);
        await tx.release();
        expect(log).to.deep.equal(["START TRANSACTION", "insert into t values(?)", "ROLLBACK", "<release>"]);
    });

    it("treats a failed COMMIT as still open and rolls back on release", async function () {
        const { pool, log } = createFakePool({ behaviour: sql => (sql === "COMMIT" ? new Error("deadlock") : null) });
        const tx = await openTransaction(pool);
        let thrown: any = null;
        try {
            await tx.query("COMMIT");
        } catch (e) {
            thrown = e;
        }
        expect(thrown).to.be.instanceOf(Error);
        await tx.release();
        expect(log).to.deep.equal(["START TRANSACTION", "COMMIT", "ROLLBACK", "<release>"]);
    });

    it("destroys the connection instead of pooling it when the release-time rollback fails", async function () {
        const { pool, log } = createFakePool({ behaviour: sql => (sql === "ROLLBACK" ? new Error("gone") : null) });
        const tx = await openTransaction(pool);
        await tx.release();
        expect(log).to.deep.equal(["START TRANSACTION", "ROLLBACK", "<destroy>"]);
    });

    it("rejects and destroys the connection when START TRANSACTION fails", async function () {
        const { pool, log } = createFakePool({ behaviour: sql => (sql === "START TRANSACTION" ? new Error("nope") : null) });
        let thrown: any = null;
        try {
            await openTransaction(pool);
        } catch (e) {
            thrown = e;
        }
        expect(thrown).to.have.property("message", "nope");
        expect(log).to.deep.equal(["START TRANSACTION", "<destroy>"]);
    });

    it("rejects when the pool cannot provide a connection", async function () {
        const { pool, log } = createFakePool({ getConnectionError: new Error("pool exhausted") });
        let thrown: any = null;
        try {
            await openTransaction(pool);
        } catch (e) {
            thrown = e;
        }
        expect(thrown).to.have.property("message", "pool exhausted");
        expect(log).to.deep.equal([]);
    });

    it("rejects query errors", async function () {
        const { pool } = createFakePool({ behaviour: sql => (sql.startsWith("insert") ? new Error("dup") : null) });
        const tx = await openTransaction(pool);
        let thrown: any = null;
        try {
            await tx.query("insert into t values(1)");
        } catch (e) {
            thrown = e;
        }
        expect(thrown).to.have.property("message", "dup");
        await tx.release();
    });
});
