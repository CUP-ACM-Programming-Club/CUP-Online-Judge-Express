import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "mail", timestamps: false })
export class mail extends Model<mail> {
    @Column({ field: "mail_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    mailId?: number;
    @Column({ field: "to_user", type: DataType.STRING(48) })
    @Index({ name: "uid", using: "BTREE", order: "ASC", unique: false })
    toUser!: string;
    @Column({ field: "from_user", type: DataType.STRING(48) })
    fromUser!: string;
    @Column({ type: DataType.STRING(200) })
    title!: string;
    @Column({ allowNull: true, type: DataType.STRING })
    content?: string;
    @Column({ field: "new_mail", type: DataType.TINYINT })
    newMail!: number;
    @Column({ allowNull: true, type: DataType.TINYINT })
    reply?: number;
    @Column({ field: "in_date", allowNull: true, type: DataType.DATE })
    inDate?: Date;
    @Column({ type: DataType.CHAR(1) })
    defunct!: string;
}