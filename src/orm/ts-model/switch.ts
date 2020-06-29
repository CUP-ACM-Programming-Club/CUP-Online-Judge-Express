import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "switch", timestamps: false })
export class Switch extends Model<Switch> {
    @Column({ primaryKey: true, type: DataType.STRING(128) })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    key!: string;
    @Column({ type: DataType.INTEGER })
    value!: number;
    @Column({ allowNull: true, type: DataType.STRING(128) })
    comment?: string;
    @Column({ field: "modify_time", type: DataType.DATE })
    modifyTime!: Date;
    @Column({ type: DataType.DATE })
    createdAt!: Date;
    @Column({ type: DataType.DATE })
    updatedAt!: Date;
}
