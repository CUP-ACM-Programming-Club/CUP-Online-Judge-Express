/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("online", {
		hash: {
			type: DataTypes.STRING(32),
			allowNull: false,
			primaryKey: true
		},
		ip: {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: ""
		},
		ua: {
			type: DataTypes.STRING(255),
			allowNull: false,
			defaultValue: ""
		},
		refer: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		lastmove: {
			type: DataTypes.INTEGER(10),
			allowNull: false
		},
		firsttime: {
			type: DataTypes.INTEGER(10),
			allowNull: true
		},
		uri: {
			type: DataTypes.STRING(255),
			allowNull: true
		}
	}, {
		tableName: "online"
	});
};
