import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "contest_set", timestamps: false })
export class contestSet extends Model<contestSet> {
    @Column({ field: "contestset_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    contestsetId?: number;
    @Column({ type: DataType.STRING(128) })
    title!: string;
    @Column({ type: DataType.STRING(64) })
    creator!: string;
    @Column({ allowNull: true, type: DataType.STRING })
    description?: string;
    @Column({ field: "create_time", type: DataType.DATE })
    createTime!: Date;
    @Column({ allowNull: true, type: DataType.TINYINT })
    visible?: number;
    @Column({ allowNull: true, type: DataType.STRING(1) })
    defunct?: string;
}