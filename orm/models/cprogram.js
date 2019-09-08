/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("cprogram", {
		name: {
			type: DataTypes.STRING(10),
			allowNull: false
		},
		user_id: {
			type: DataTypes.STRING(30),
			allowNull: false
		},
		sex: {
			type: DataTypes.INTEGER(4),
			allowNull: false
		},
		scholar: {
			type: DataTypes.STRING(32),
			allowNull: false
		},
		subject: {
			type: DataTypes.STRING(32),
			allowNull: false
		},
		teacher: {
			type: DataTypes.STRING(32),
			allowNull: false
		},
		class: {
			type: DataTypes.STRING(16),
			allowNull: false
		},
		bornday: {
			type: DataTypes.STRING(24),
			allowNull: false
		},
		mobile_phone: {
			type: DataTypes.STRING(15),
			allowNull: false
		},
		qq: {
			type: DataTypes.STRING(15),
			allowNull: false
		},
		wechat: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		email: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		group: {
			type: DataTypes.INTEGER(4),
			allowNull: false
		},
		room: {
			type: DataTypes.INTEGER(11),
			allowNull: true,
			defaultValue: "0"
		},
		seat: {
			type: DataTypes.INTEGER(11),
			allowNull: true,
			defaultValue: "0"
		},
		pass: {
			type: DataTypes.INTEGER(1),
			allowNull: true,
			defaultValue: "0"
		}
	}, {
		tableName: "cprogram"
	});
};
