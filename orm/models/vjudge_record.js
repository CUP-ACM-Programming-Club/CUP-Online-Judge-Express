/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("vjudge_record", {
		user_id: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		oj_name: {
			type: DataTypes.STRING(30),
			allowNull: false
		},
		problem_id: {
			type: DataTypes.STRING(20),
			allowNull: false
		},
		time: {
			type: DataTypes.DATE,
			allowNull: false
		},
		result: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "4"
		},
		time_running: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		memory: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		code_length: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		language: {
			type: DataTypes.STRING(25),
			allowNull: false,
			defaultValue: "C++"
		}
	}, {
		tableName: "vjudge_record"
	});
};
