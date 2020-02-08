import {MySQLManager} from "../manager/mysql/MySQLManager";

const query = MySQLManager.execQuery;

query.pool = MySQLManager.mysqlPool;

const _end = query.pool.end;
query.pool.end = function() {
	if(!this._closed) {
		_end.apply(this, arguments);
	}
};

module.exports = query;
