// @ts-ignore
const Importer = require("mysql-import");
export default async function () {
    const init = global.config.init;
    if (!init) {
        const importer = new Importer(global.config.mysql);
        await importer.import('path/to/dump.sql');
        const files_imported = importer.getImported();
        console.log(`${files_imported.length} SQL file(s) imported.`);
    }
}

