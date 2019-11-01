/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("mail", {
		mail_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		to_user: {
			type: DataTypes.STRING(48),
			allowNull: false,
			defaultValue: ""
		},
		from_user: {
			type: DataTypes.STRING(48),
			allowNull: false,
			defaultValue: ""
		},
		title: {
			type: DataTypes.STRING(200),
			allowNull: false,
			defaultValue: ""
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		new_mail: {
			type: DataTypes.INTEGER(1),
			allowNull: false,
			defaultValue: "1"
		},
		reply: {
			type: DataTypes.INTEGER(4),
			allowNull: true,
			defaultValue: "0"
		},
		in_date: {
			type: DataTypes.DATE,
			allowNull: true
		},
		defunct: {
			type: DataTypes.CHAR(1),
			allowNull: false,
			defaultValue: "N"
		}
	}, {
		tableName: "mail"
	});
};
