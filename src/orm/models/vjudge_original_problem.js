/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("vjudge_original_problem", {
		original_problem_id: {
			type: DataTypes.STRING(48),
			allowNull: false,
			primaryKey: true
		},
		problem_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		source: {
			type: DataTypes.STRING(10),
			allowNull: false
		}
	}, {
		tableName: "vjudge_original_problem"
	});
};
