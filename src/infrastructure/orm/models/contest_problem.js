/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("contest_problem", {
		problem_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		contest_id: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		title: {
			type: DataTypes.CHAR(200),
			allowNull: false,
			defaultValue: ""
		},
		oj_name: {
			type: DataTypes.CHAR(10),
			allowNull: true
		},
		num: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		}
	}, {
		tableName: "contest_problem",
		timestamps: false
	});
};
