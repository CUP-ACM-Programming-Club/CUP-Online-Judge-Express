import {MySQLManager} from "../manager/mysql/MySQLManager";

const query: typeof MySQLManager.execQuery & {pool: typeof MySQLManager.mysqlPool & {_closed?: boolean}} = MySQLManager.execQuery as any;

query.pool = MySQLManager.mysqlPool;

const _end = query.pool.end;
query.pool.end = function(...args) {
	if(!this._closed) {
		_end.apply(this, args);
	}
};

export = query;
