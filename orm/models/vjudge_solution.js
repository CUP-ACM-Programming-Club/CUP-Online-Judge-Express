/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("vjudge_solution", {
		runner_id: {
			type: DataTypes.TEXT,
			allowNull: true
		},
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
			type: DataTypes.CHAR(42),
			allowNull: false
		},
		contest_id: {
			type: DataTypes.INTEGER(11),
			allowNull: true
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
		oj_name: {
			type: DataTypes.STRING(24),
			allowNull: false
		},
		judger: {
			type: DataTypes.STRING(24),
			allowNull: false
		},
		ustatus: {
			type: DataTypes.INTEGER(1),
			allowNull: true,
			defaultValue: "0"
		},
		share: {
			type: DataTypes.INTEGER(1),
			allowNull: true,
			defaultValue: "0"
		}
	}, {
		tableName: "vjudge_solution"
	});
};
