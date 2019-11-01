/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("contest_clarification", {
		contest_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		time: {
			type: DataTypes.DATE,
			allowNull: true
		},
		discuss_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		}
	}, {
		tableName: "contest_clarification"
	});
};
