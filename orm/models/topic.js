/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("topic", {
		tid: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		title: {
			type: "VARBINARY(60)",
			allowNull: false
		},
		status: {
			type: DataTypes.INTEGER(2),
			allowNull: false,
			defaultValue: "0"
		},
		top_level: {
			type: DataTypes.INTEGER(2),
			allowNull: false,
			defaultValue: "0"
		},
		cid: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		pid: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		author_id: {
			type: DataTypes.STRING(48),
			allowNull: false
		}
	}, {
		tableName: "topic"
	});
};
