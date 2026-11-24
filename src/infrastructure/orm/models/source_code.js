/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("source_code", {
		solution_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		source: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	}, {
		tableName: "source_code"
	});
};
