import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "topic", timestamps: false })
export class topic extends Model<topic> {
    @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    tid?: number;
    @Column({})
    title!: any;
    @Column({ type: DataType.INTEGER })
    status!: number;
    @Column({ field: "top_level", type: DataType.INTEGER })
    topLevel!: number;
    @Column({ allowNull: true, type: DataType.INTEGER })
    @Index({ name: "cid", using: "BTREE", order: "ASC", unique: false })
    cid?: number;
    @Column({ type: DataType.INTEGER })
    @Index({ name: "cid", using: "BTREE", order: "ASC", unique: false })
    pid!: number;
    @Column({ field: "author_id", type: DataType.STRING(48) })
    authorId!: string;
}