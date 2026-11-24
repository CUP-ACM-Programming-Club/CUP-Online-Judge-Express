import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "news", timestamps: false })
export class news extends Model<news> {
    @Column({ field: "news_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    newsId?: number;
    @Column({ field: "user_id", type: DataType.STRING(48) })
    userId!: string;
    @Column({ type: DataType.STRING(200) })
    title!: string;
    @Column({ type: DataType.STRING })
    content!: string;
    @Column({ type: DataType.DATE })
    time!: Date;
    @Column({ type: DataType.TINYINT })
    importance!: number;
    @Column({ type: DataType.CHAR(1) })
    defunct!: string;
}