import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "online", timestamps: false })
export class online extends Model<online> {
    @Column({ primaryKey: true, type: DataType.STRING(32) })
    @Index({ name: "hash", using: "BTREE", order: "ASC", unique: true })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    hash!: string;
    @Column({ type: DataType.STRING(20) })
    ip!: string;
    @Column({ type: DataType.STRING(255) })
    ua!: string;
    @Column({ allowNull: true, type: DataType.STRING(255) })
    refer?: string;
    @Column({ type: DataType.INTEGER })
    lastmove!: number;
    @Column({ allowNull: true, type: DataType.INTEGER })
    firsttime?: number;
    @Column({ allowNull: true, type: DataType.STRING(255) })
    uri?: string;
}