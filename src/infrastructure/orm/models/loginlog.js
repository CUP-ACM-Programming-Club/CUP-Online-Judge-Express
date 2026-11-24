/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("loginlog", {
		user_id: {
			type: DataTypes.STRING(48),
			allowNull: false,
			defaultValue: ""
		},
		password: {
			type: DataTypes.STRING(40),
			allowNull: true
		},
		ip: {
			type: DataTypes.STRING(100),
			allowNull: true
		},
		time: {
			type: DataTypes.DATE,
			allowNull: true
		},
		browser_name: {
			type: DataTypes.STRING(20),
			allowNull: true
		},
		browser_version: {
			type: DataTypes.STRING(10),
			allowNull: true
		},
		os_name: {
			type: DataTypes.STRING(20),
			allowNull: true
		},
		os_version: {
			type: DataTypes.STRING(10),
			allowNull: true
		}
	}, {
		tableName: "loginlog"
	});
};
