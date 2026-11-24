/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("users_account", {
		user_id: {
			type: DataTypes.STRING(48),
			allowNull: false,
			defaultValue: ""
		},
		hdu: {
			type: DataTypes.STRING(48),
			allowNull: true
		},
		poj: {
			type: DataTypes.STRING(48),
			allowNull: true
		},
		codeforces: {
			type: DataTypes.STRING(48),
			allowNull: true
		},
		uva: {
			type: DataTypes.STRING(48),
			allowNull: true
		},
		vjudge: {
			type: DataTypes.STRING(48),
			allowNull: true
		},
		"hustoj-upc": {
			type: DataTypes.STRING(48),
			allowNull: true
		},
		upcvj: {
			type: DataTypes.STRING(48),
			allowNull: true
		},
		cup: {
			type: DataTypes.STRING(48),
			allowNull: true
		}
	}, {
		tableName: "users_account"
	});
};
