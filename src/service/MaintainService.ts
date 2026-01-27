import cache_query = require("../module/mysql_cache");

class MaintainService {
    async getMaintainInfo(limit = false) {
        return await cache_query(`select * from maintain_info order by mtime desc ${limit ? "limit 1" : ""}`);
    }
}

export default new MaintainService();
