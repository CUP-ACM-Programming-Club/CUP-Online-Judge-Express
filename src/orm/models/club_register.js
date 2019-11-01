/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("club_register", {
		user_id: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		name: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		sex: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "0"
		},
		class: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		mobile_phone: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		qq: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		wechat: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		email: {
			type: DataTypes.CHAR(48),
			allowNull: false
		},
		club: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "0"
		}
	}, {
		tableName: "club_register"
	});
};
