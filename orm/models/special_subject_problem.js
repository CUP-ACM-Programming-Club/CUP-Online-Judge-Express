/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("special_subject_problem", {
		problem_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		topic_id: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		title: {
			type: DataTypes.CHAR(200),
			allowNull: true
		},
		oj_name: {
			type: DataTypes.CHAR(20),
			allowNull: true
		},
		num: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		}
	}, {
		tableName: "special_subject_problem"
	});
};
