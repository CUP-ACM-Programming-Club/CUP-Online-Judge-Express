import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "config", timestamps: false })
export class config extends Model<config> {
    @Column({ primaryKey: true, type: DataType.STRING(40) })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    key!: string;
    @Column({ type: DataType.STRING(4096) })
    value!: string;
    @Column({ allowNull: true, type: DataType.STRING(128) })
    comment?: string;
    @Column({ field: "modify_time", type: DataType.DATE })
    modifyTime!: Date;
    @Column({ type: DataType.DATE })
    createdAt!: Date;
    @Column({ type: DataType.DATE })
    updatedAt!: Date;
}