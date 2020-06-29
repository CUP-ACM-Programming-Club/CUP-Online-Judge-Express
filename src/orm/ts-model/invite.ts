import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "invite", timestamps: false })
export class invite extends Model<invite> {
    @Column({ field: "invite_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "invite_code_invite_id_uindex", using: "BTREE", order: "ASC", unique: true })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    inviteId?: number;
    @Column({ field: "user_id", type: DataType.STRING(128) })
    @Index({ name: "invite_code_user_id_index", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ field: "invite_code", type: DataType.STRING(96) })
    @Index({ name: "invite_code_invite_code_uindex", using: "BTREE", order: "ASC", unique: true })
    inviteCode!: string;
    @Column({ field: "valid_date", type: DataType.DATE })
    @Index({ name: "invite_code_valid_date_index", using: "BTREE", order: "ASC", unique: false })
    validDate!: Date;
    @Column({ field: "valid_time", type: DataType.INTEGER })
    validTime!: number;
}