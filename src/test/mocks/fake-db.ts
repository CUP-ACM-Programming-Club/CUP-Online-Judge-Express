const tables: any = Object.create(null);
const autoIncrement: any = Object.create(null);
const customHandlers: any[] = [];

function normalizeTableName(name) {
	return name.replace(/`/g, "").toLowerCase();
}

function getTable(name) {
	const tableName = normalizeTableName(name);
	if (!tables[tableName]) {
		tables[tableName] = [];
	}
	return tables[tableName];
}

function nextId(tableName) {
	const name = normalizeTableName(tableName);
	if (!autoIncrement[name]) {
		autoIncrement[name] = 1;
	}
	const id = autoIncrement[name];
	autoIncrement[name] += 1;
	return id;
}

function splitList(text) {
	const parts = [];
	let current = "";
	let inQuote = false;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch === "'" && text[i - 1] !== "\\") {
			inQuote = !inQuote;
		}
		if (!inQuote && ch === ",") {
			if (current.trim()) {
				parts.push(current.trim());
			}
			current = "";
			continue;
		}
		current += ch;
	}
	if (current.trim()) {
		parts.push(current.trim());
	}
	return parts;
}

function parseValueGroups(valuesPart) {
	const groups = [];
	let current = "";
	let depth = 0;
	for (let i = 0; i < valuesPart.length; i++) {
		const ch = valuesPart[i];
		if (ch === "(") {
			if (depth > 0) {
				current += ch;
			}
			depth += 1;
			continue;
		}
		if (ch === ")") {
			depth -= 1;
			if (depth === 0) {
				groups.push(current.trim());
				current = "";
				continue;
			}
		}
		if (depth > 0) {
			current += ch;
		}
	}
	return groups;
}

function parseToken(token, params, indexRef) {
	const trimmed = token.trim();
	if (trimmed === "?") {
		const value = params[indexRef.index];
		indexRef.index += 1;
		return value;
	}
	if (/^null$/i.test(trimmed)) {
		return null;
	}
	if (/^now\(\)$/i.test(trimmed)) {
		return new Date().toISOString();
	}
	if (/^'.*'$/.test(trimmed)) {
		return trimmed.slice(1, -1).replace(/''/g, "'");
	}
	if (/^".*"$/.test(trimmed)) {
		return trimmed.slice(1, -1);
	}
	if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
		return Number(trimmed);
	}
	return trimmed;
}

function getRowValue(row, column) {
	const clean = column.replace(/`/g, "");
	const key = clean.includes(".") ? clean.split(".").pop() : clean;
	if (Object.prototype.hasOwnProperty.call(row, key)) {
		return row[key];
	}
	const lower = key.toLowerCase();
	for (const prop in row) {
		if (prop.toLowerCase() === lower) {
			return row[prop];
		}
	}
	return undefined;
}

function splitByKeyword(text, keyword) {
	const re = new RegExp(`\\s+${keyword}\\s+`, "i");
	return text.split(re).map(part => part.trim()).filter(Boolean);
}

function parseCondition(condition, params, indexRef) {
	const cond = condition.trim();
	const lower = cond.toLowerCase();
	const inMatch = cond.match(/(.+?)\s+in\s+\((.+)\)$/i);
	if (inMatch) {
		const column = inMatch[1].trim();
		const list = inMatch[2].trim();
		if (/select\s+contest_id\s+from\s+contest_problem/i.test(list)) {
			const problemId = parseToken("?", params, indexRef);
			const ids = getTable("contest_problem")
				.filter(row => getRowValue(row, "problem_id") == problemId)
				.map(row => getRowValue(row, "contest_id"));
			return row => ids.includes(getRowValue(row, column));
		}
		const values = splitList(list).map(token => parseToken(token, params, indexRef));
		return row => values.includes(getRowValue(row, column));
	}
	const likeMatch = cond.match(/(.+?)\s+like\s+(.+)/i);
	if (likeMatch) {
		const column = likeMatch[1].trim();
		const value = parseToken(likeMatch[2], params, indexRef);
		const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*");
		const re = new RegExp(`^${escaped}$`, "i");
		return row => re.test(String(getRowValue(row, column) || ""));
	}
	const gtMatch = cond.match(/(.+?)\s*>\s*(.+)/);
	if (gtMatch) {
		const column = gtMatch[1].trim();
		const value = parseToken(gtMatch[2], params, indexRef);
		return row => getRowValue(row, column) > value;
	}
	const ltMatch = cond.match(/(.+?)\s*<\s*(.+)/);
	if (ltMatch) {
		const column = ltMatch[1].trim();
		const value = parseToken(ltMatch[2], params, indexRef);
		return row => getRowValue(row, column) < value;
	}
	const eqMatch = cond.match(/(.+?)\s*=\s*(.+)/);
	if (eqMatch) {
		const column = eqMatch[1].trim();
		const value = parseToken(eqMatch[2], params, indexRef);
		return row => getRowValue(row, column) == value;
	}
	return () => true;
}

function buildWhere(whereClause, params) {
	const indexRef = { index: 0 };
	const orGroups = splitByKeyword(whereClause, "or").map(group => {
		return splitByKeyword(group, "and").map(cond => parseCondition(cond, params, indexRef));
	});
	return row => orGroups.some(group => group.every(fn => fn(row)));
}

function handleInsert(sql, params) {
	const match = sql.match(/insert\s+into\s+([^\s(]+)\s*\(([^)]+)\)\s*values\s*([\s\S]+)$/i);
	if (!match) {
		return { insertId: 0 };
	}
	const tableName = match[1];
	const columns = splitList(match[2]).map(col => col.replace(/`/g, "").trim());
	const valuesPart = match[3].replace(/;$/, "").trim();
	const groups = parseValueGroups(valuesPart);
	const table = getTable(tableName);
	let firstInsertId = 0;
	const indexRef = { index: 0 };
	groups.forEach(group => {
		const tokens = splitList(group);
		const row = {};
		columns.forEach((col, idx) => {
			row[col] = parseToken(tokens[idx] || "null", params, indexRef);
		});
		if (normalizeTableName(tableName) === "problem" && typeof row.defunct === "undefined") {
			row.defunct = "N";
		}
		if (normalizeTableName(tableName) === "contest") {
			if (typeof row.start_time === "undefined") {
				row.start_time = new Date().toISOString();
			}
			if (typeof row.title === "undefined") {
				row.title = "";
			}
			if (typeof row.show_all_ranklist === "undefined") {
				row.show_all_ranklist = 1;
			}
		}
		if (normalizeTableName(tableName) === "solution" && typeof row.solution_id === "undefined") {
			row.solution_id = nextId(tableName);
		}
		if (firstInsertId === 0 && typeof row.solution_id !== "undefined") {
			firstInsertId = row.solution_id;
		}
		table.push(row);
	});
	return { insertId: firstInsertId };
}

function handleDelete(sql, params) {
	const match = sql.match(/delete\s+from\s+([^\s]+)(?:\s+where\s+([\s\S]+))?/i);
	if (!match) {
		return { affectedRows: 0 };
	}
	const tableName = match[1];
	const table = getTable(tableName);
	if (!match[2]) {
		const count = table.length;
		table.length = 0;
		return { affectedRows: count };
	}
	const whereClause = match[2].replace(/;$/, "");
	const matchRow = buildWhere(whereClause, params);
	let removed = 0;
	for (let i = table.length - 1; i >= 0; i--) {
		if (matchRow(table[i])) {
			table.splice(i, 1);
			removed += 1;
		}
	}
	return { affectedRows: removed };
}

function handleUpdate(sql, params) {
	const match = sql.match(/update\s+([^\s]+)\s+set\s+(.+?)\s+where\s+([\s\S]+)$/i);
	if (!match) {
		return { affectedRows: 0 };
	}
	const tableName = match[1];
	const setPart = match[2];
	const whereClause = match[3].replace(/;$/, "");
	const table = getTable(tableName);
	const indexRef = { index: 0 };
	const assignments = splitList(setPart).map(part => part.trim());
	const setValues = assignments.map(assign => {
		const pieces = assign.split("=");
		return {
			column: pieces[0].trim().replace(/`/g, ""),
			value: parseToken(pieces[1], params, indexRef)
		};
	});
	const matchRow = buildWhere(whereClause, params);
	let updated = 0;
	table.forEach(row => {
		if (matchRow(row)) {
			setValues.forEach(({ column, value }) => {
				row[column] = value;
			});
			updated += 1;
		}
	});
	return { affectedRows: updated };
}

function handleSelect(sql, params) {
	const normalized = sql.replace(/\s+/g, " ").trim();
	const lower = normalized.toLowerCase();
	if (lower.includes(" join ") || lower.includes(" union ")) {
		return [];
	}
	if (lower.includes(" in (select ")) {
		return [];
	}
	const match = normalized.match(/select\s+(.+?)\s+from\s+([^\s]+)([\s\S]*)$/i);
	if (!match) {
		return [];
	}
	const columnsPart = match[1].trim();
	const tableName = match[2];
	let remainder = match[3] || "";
	let whereClause = "";
	const whereIndex = remainder.toLowerCase().indexOf(" where ");
	if (whereIndex !== -1) {
		whereClause = remainder.slice(whereIndex + 7);
		const cutIndex = whereClause.search(/\s+(order by|group by|limit)\s+/i);
		if (cutIndex !== -1) {
			whereClause = whereClause.slice(0, cutIndex);
		}
	}
	const table = getTable(tableName);
	let rows = table.slice();
	if (whereClause) {
		const matchRow = buildWhere(whereClause, params);
		rows = rows.filter(matchRow);
	}
	if (/count\(/i.test(columnsPart)) {
		const aliasMatch = columnsPart.match(/count\(([^)]+)\)\s*(?:as\s+)?([a-z0-9_]+)?/i);
		const alias = (aliasMatch && aliasMatch[2]) ? aliasMatch[2] : "count";
		let count = rows.length;
		if (aliasMatch && /distinct/i.test(aliasMatch[1])) {
			const distinctColumn = aliasMatch[1].replace(/distinct/i, "").trim();
			const values = new Set(rows.map(row => getRowValue(row, distinctColumn)));
			count = values.size;
		}
		return [{ [alias]: count }];
	}
	if (columnsPart === "*") {
		return rows.map(row => Object.assign({}, row));
	}
	const columns = splitList(columnsPart).map(col => col.trim());
	return rows.map(row => {
		const result = {};
		columns.forEach(colSpec => {
			const aliasMatch = colSpec.match(/(.+?)\s+as\s+(.+)/i);
			let source = colSpec;
			let alias = colSpec;
			if (aliasMatch) {
				source = aliasMatch[1].trim();
				alias = aliasMatch[2].trim();
			}
			if (/^null$/i.test(source)) {
				result[alias] = null;
				return;
			}
			const key = source.replace(/`/g, "");
			const value = getRowValue(row, key);
			result[alias.includes(".") ? alias.split(".").pop() : alias] = value;
		});
		return result;
	});
}

function exec(sql, params) {
	if (typeof sql !== "string") {
		return [];
	}
	const trimmed = sql.trim();
	const lower = trimmed.toLowerCase();
	if (!trimmed) {
		return [];
	}
	for (const handler of customHandlers) {
		if (handler.matcher(trimmed, params)) {
			return handler.handle(trimmed, params);
		}
	}
	if (lower.startsWith("select")) {
		return handleSelect(trimmed, params);
	}
	if (lower.startsWith("insert")) {
		return handleInsert(trimmed, params);
	}
	if (lower.startsWith("delete")) {
		return handleDelete(trimmed, params);
	}
	if (lower.startsWith("update")) {
		return handleUpdate(trimmed, params);
	}
	if (lower.startsWith("commit") || lower.startsWith("rollback")) {
		return [];
	}
	return [];
}

function query(sql: any, params: any, callback: any) {
	const args = Array.isArray(params) ? params : [];
	const result = exec(sql, args);
	if (typeof callback === "function") {
		callback(result, []);
		return;
	}
	return Promise.resolve(result);
}

const pool = {
	_closed: false,
	end() {
		this._closed = true;
	}
};

query.pool = pool;

function transaction() {
	return Promise.resolve({
		query: (sql, params) => Promise.resolve(exec(sql, params || [])),
		release: () => Promise.resolve()
	});
}

export = {
	query,
	transaction,
	pool,
	tables,
	registerHandler(matcher: any, handle: any) {
		customHandlers.push({ matcher, handle });
	},
	clearHandlers() {
		customHandlers.length = 0;
	},
	reset() {
		Object.keys(tables).forEach(key => {
			tables[key] = [];
		});
		Object.keys(autoIncrement).forEach(key => {
			autoIncrement[key] = 1;
		});
	}
};
