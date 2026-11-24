/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("compileinfo", {
		solution_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0",
			primaryKey: true
		},
		error: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: "compileinfo"
	});
};
