import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "sim", timestamps: false })
export class sim extends Model<sim> {
    @Column({ field: "s_id", primaryKey: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    @Index({ name: "sim_s_id_index", using: "BTREE", order: "ASC", unique: false })
    sId!: number;
    @Column({ field: "sim_s_id", allowNull: true, type: DataType.INTEGER })
    simSId?: number;
    @Column({ allowNull: true, type: DataType.INTEGER })
    sim?: number;
    @Column({ field: "s_user_id", allowNull: true, type: DataType.CHAR(48) })
    @Index({ name: "sim_s_user_id_index", using: "BTREE", order: "ASC", unique: false })
    sUserId?: string;
    @Column({ field: "s_s_user_id", allowNull: true, type: DataType.CHAR(48) })
    sSUserId?: string;
}