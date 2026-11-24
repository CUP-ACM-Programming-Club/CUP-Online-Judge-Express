import path from "path";
// @ts-ignore
const Importer = require("mysql-import");
export default async function () {
    try {
        const init = global.config.init;
        if (!init) {
            const cfg = JSON.parse(JSON.stringify(global.config.mysql));
            if (cfg.database) {
                delete cfg.database;
            }
            const importer = new Importer(cfg);
            await importer.import(`${path.join(process.cwd(), "script", "structure.sql")}`);
            const files_imported = importer.getImported();
            console.log(`${files_imported.length} SQL file(s) imported.`);
        }
    }
    catch (e) {
        console.log(`Warn: Catch log:`, e);
    }
}

