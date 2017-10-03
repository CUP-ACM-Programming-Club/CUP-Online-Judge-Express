const mysql = require("mysql");
const config = require('../config.json');
const pool = mysql.createPool(config['mysql']);
const query = function (sql_query, sqlArr, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log(err);
        }
        else {
            conn.query(sql_query, sqlArr, function (err, results, fields) {
                conn.release();
                if (typeof callback === "function")
                    callback(results);
            })
        }
    })
};
module.exports = query;