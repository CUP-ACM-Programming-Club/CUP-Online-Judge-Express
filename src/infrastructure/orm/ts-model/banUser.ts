import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "ban_user", timestamps: false })
export class banUser extends Model<banUser> {
    @Column({ field: "user_id", primaryKey: true, type: DataType.STRING(40) })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    userId!: string;
    @Column({ type: DataType.DATE })
    bantime!: Date;
}