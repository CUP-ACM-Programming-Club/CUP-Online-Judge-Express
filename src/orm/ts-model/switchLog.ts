import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "switch_log", timestamps: false })
export class switchLog extends Model<switchLog> {
    @Column({ primaryKey: true, autoIncrement: true, type: DataType.BIGINT })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    id?: number;
    @Column({ type: DataType.INTEGER })
    operation!: number;
    @Column({ type: DataType.STRING(128) })
    key!: string;
    @Column({ type: DataType.INTEGER })
    value!: number;
    @Column({ type: DataType.STRING(1024) })
    comment!: string;
    @Column({ type: DataType.DATE })
    createdAt!: Date;
    @Column({ type: DataType.DATE })
    updatedAt!: Date;
}