/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("privilege", {
		user_id: {
			type: DataTypes.CHAR(48),
			allowNull: false,
			defaultValue: ""
		},
		rightstr: {
			type: DataTypes.CHAR(30),
			allowNull: false,
			defaultValue: ""
		},
		defunct: {
			type: DataTypes.CHAR(1),
			allowNull: false,
			defaultValue: "N"
		}
	}, {
		tableName: "privilege"
	});
};
