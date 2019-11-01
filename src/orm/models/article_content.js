/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("article_content", {
		user_id: {
			type: DataTypes.STRING(35),
			allowNull: false
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		create_time: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
		},
		edit_time: {
			type: DataTypes.DATE,
			allowNull: true
		},
		article_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		comment_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		}
	}, {
		tableName: "article_content"
	});
};
