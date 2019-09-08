/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("vjudge_problem", {
		problem_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		vjudge_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		title: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		label: {
			type: DataTypes.STRING(100),
			allowNull: true
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		input: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		output: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		sample_input: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		sample_output: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		accepted: {
			type: DataTypes.INTEGER(11),
			allowNull: true,
			defaultValue: "0"
		},
		submit: {
			type: DataTypes.INTEGER(11),
			allowNull: true,
			defaultValue: "0"
		},
		time_limit: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		memory_limit: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		source: {
			type: DataTypes.STRING(10),
			allowNull: false
		},
		spj: {
			type: DataTypes.INTEGER(4),
			allowNull: true,
			defaultValue: "0"
		},
		defunct: {
			type: DataTypes.STRING(3),
			allowNull: true,
			defaultValue: "N"
		},
		in_date: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
		}
	}, {
		tableName: "vjudge_problem"
	});
};
