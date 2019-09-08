/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("custominput", {
		solution_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0",
			primaryKey: true
		},
		input_text: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: "custominput"
	});
};
