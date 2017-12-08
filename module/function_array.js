const query = require('./mysql_query');
const cachePool = require('cachePool');
const usr_admin = async (user_id) => {
    const _res = cachePool.get("user_admin:" + user_id);
    let dataList = [];
    if (_res === undefined) {
        let sql = "select rightstr from privilege where user_id = ? and rightstr='administrator'";
        let sqlArr = [user_id];
        dataList = await query(sql, sqlArr);
        if (dataList.length > 0) {
            cachePool.set("user_admin:" + user_id, true, 10 * 24 * 60 * 60);
            return true;
        }
        return false;

    }
    else
        return true;
};

const usr_contest = async (user_id, cid) => {
    let dataList = [];
    const _res = cachePool.get("user_contest_" + cid + ":" + user_id);
    if (_res === undefined) {
        let sql = "select rightstr from privilege where user_id = ? and rightstr like ?"
        let sqlArr = [user_id, 'c' + cid];
        dataList = await query(sql, sqlArr);
        if (dataList.length > 0) {
            cachePool.set("user_contest_" + cid + ":" + user_id, true, 10 * 24 * 60 * 60);
            return true;
        }
        return false;
    }
    else
        return true;
};
const func_tree = {
    "admin": usr_admin,
    "contest": usr_contest
};
module.exports = func_tree;