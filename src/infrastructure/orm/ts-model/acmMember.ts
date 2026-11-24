import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "acm_member", timestamps: false })
export class acmMember extends Model<acmMember> {
    @Column({ field: "user_id", type: DataType.STRING(48) })
    @Index({ name: "acm_member_user_id_index", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ type: DataType.TINYINT })
    level!: number;
}