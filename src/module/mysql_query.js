/*
const mysql = require("mysql2");
const config = require('../../config.json');
const pool = mysql.createPool(config['mysql']);
const query = function (sql_query, sqlArr, callback) {
    if (typeof callback === "function") {
        pool.getConnection(function (err, conn) {
            if (err) {
                console.log(err);
            }
            else {
                conn.query(sql_query, sqlArr, function (err, results, fields) {
                    callback(results, fields);
                })
            }
            conn.release();
        });
    }
    else {
        return new Promise((resolve, reject) => {
            pool.getConnection(function (err, connection) {
                if (err) {
                    reject(err);
                }
                else {
                    connection.query(sql_query, sqlArr, (err, results, fields) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(results, fields);
                        }
                    })
                }
                connection.release();
            })
        })
    }
};
module.exports = query;
*/
const mysql = require("mysql2");
const config = global.config;
//const connection = mysql.createConnection(config["mysql"]);
let pool = mysql.createPool(config["mysql"]);
const query = function (sql_query, sqlArr, callback) {
	if(!pool || pool._closed) {
		query.pool = pool = mysql.createPool(config["mysql"]);
	}
	if (typeof callback === "function") {
		pool.query(sql_query, sqlArr, function (err, results, fields) {
			callback(results, fields);
		});
	}
	else {
		return new Promise((resolve, reject) => {
			pool.query(sql_query, sqlArr, function (err, results, fields) {
				if (err) {
					reject(err);
				}
				else {
					resolve(results, fields);
				}
			});
		});
	}
	//connection.end();
};

query.pool = pool;

const _end = query.pool.end;
query.pool.end = function() {
	if(!this._closed) {
		_end.apply(this, arguments);
	}
};

module.exports = query;
