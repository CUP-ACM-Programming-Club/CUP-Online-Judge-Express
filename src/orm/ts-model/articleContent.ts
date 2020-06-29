import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "article_content", timestamps: false })
export class articleContent extends Model<articleContent> {
    @Column({ field: "user_id", type: DataType.STRING(35) })
    @Index({ name: "article_content_user_id_index", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ allowNull: true, type: DataType.STRING })
    content?: string;
    @Column({ field: "create_time", allowNull: true, type: DataType.DATE })
    @Index({ name: "article_content_create_time_index", using: "BTREE", order: "ASC", unique: false })
    createTime?: Date;
    @Column({ field: "edit_time", allowNull: true, type: DataType.DATE })
    @Index({ name: "earticle_content__index", using: "BTREE", order: "ASC", unique: false })
    editTime?: Date;
    @Column({ field: "article_id", type: DataType.INTEGER })
    articleId!: number;
    @Column({ field: "comment_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    commentId?: number;
}