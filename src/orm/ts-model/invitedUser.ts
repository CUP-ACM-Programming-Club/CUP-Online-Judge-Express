import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "invited_user", timestamps: false })
export class invitedUser extends Model<invitedUser> {
    @Column({ field: "user_id", primaryKey: true, type: DataType.STRING(64) })
    @Index({ name: "invited_user_user_id_uindex", using: "BTREE", order: "ASC", unique: true })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    userId!: string;
    @Column({ type: DataType.STRING(64) })
    inviter!: string;
    @Column({ field: "invite_date", type: DataType.DATE })
    inviteDate!: Date;
    @Column({ field: "invite_code", type: DataType.STRING(96) })
    inviteCode!: string;
}