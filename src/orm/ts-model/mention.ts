import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "mention", timestamps: false })
export class mention extends Model<mention> {
    @Column({ field: "user_id", type: DataType.STRING(40) })
    @Index({ name: "mention_user_id_index", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ field: "article_id", type: DataType.INTEGER })
    @Index({ name: "mention_article_id_index", using: "BTREE", order: "ASC", unique: false })
    articleId!: number;
    @Column({ field: "comment_id", type: DataType.INTEGER })
    commentId!: number;
    @Column({ type: DataType.TINYINT })
    viewed!: number;
}