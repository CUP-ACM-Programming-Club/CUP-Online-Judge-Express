/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("vjudge_source_code", {
		solution_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		source: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	}, {
		tableName: "vjudge_source_code"
	});
};
