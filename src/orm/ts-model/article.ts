import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "article", timestamps: false })
export class article extends Model<article> {
    @Column({ field: "user_id", type: DataType.STRING(48) })
    @Index({ name: "article_user_id_index", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ field: "article_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "article_last_post_edit_time_create_time_article_id_index", using: "BTREE", order: "DESC", unique: false })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    articleId?: number;
    @Column({ type: DataType.STRING(100) })
    title!: string;
    @Column({ type: DataType.STRING(2) })
    defunct!: string;
    @Column({ field: "create_time", allowNull: true, type: DataType.DATE })
    @Index({ name: "article_create_time_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "article_last_post_edit_time_create_time_article_id_index", using: "BTREE", order: "DESC", unique: false })
    createTime?: Date;
    @Column({ field: "edit_time", allowNull: true, type: DataType.DATE })
    @Index({ name: "article_edit_time_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "article_last_post_edit_time_create_time_article_id_index", using: "BTREE", order: "DESC", unique: false })
    editTime?: Date;
    @Column({ allowNull: true, type: DataType.STRING })
    content?: string;
    @Column({ field: "last_post", allowNull: true, type: DataType.DATE })
    @Index({ name: "article_last_post_edit_time_create_time_article_id_index", using: "BTREE", order: "DESC", unique: false })
    lastPost?: Date;
}