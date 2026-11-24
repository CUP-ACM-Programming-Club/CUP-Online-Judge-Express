/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define("solution", {
		solution_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		problem_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		user_id: {
			type: DataTypes.CHAR(48),
			allowNull: false
		},
		time: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		memory: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		in_date: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: "2016-05-13 19:24:00"
		},
		result: {
			type: DataTypes.INTEGER(6),
			allowNull: false,
			defaultValue: "0"
		},
		language: {
			type: DataTypes.INTEGER(10).UNSIGNED,
			allowNull: false,
			defaultValue: "0"
		},
		ip: {
			type: DataTypes.CHAR(100),
			allowNull: false
		},
		contest_id: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		topic_id: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		valid: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "1"
		},
		pass_point: {
			type: DataTypes.INTEGER(3),
			allowNull: true,
			defaultValue: "0"
		},
		num: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "-1"
		},
		code_length: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		judgetime: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
		},
		pass_rate: {
			type: DataTypes.DECIMAL,
			allowNull: false,
			defaultValue: "0.00"
		},
		judger: {
			type: DataTypes.CHAR(16),
			allowNull: false,
			defaultValue: "LOCAL"
		},
		share: {
			type: DataTypes.INTEGER(1),
			allowNull: true,
			defaultValue: "0"
		},
		fingerprint: {
			type: DataTypes.STRING(40),
			allowNull: true
		},
		fingerprintRaw: {
			type: DataTypes.STRING(40),
			allowNull: true
		}
	}, {
		tableName: "solution"
	});
};
