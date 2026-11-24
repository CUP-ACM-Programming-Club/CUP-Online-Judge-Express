import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "contest_assistant", timestamps: false })
export class contestAssistant extends Model<contestAssistant> {
    @Column({ field: "contest_id", type: DataType.INTEGER })
    @Index({ name: "contest_assistant_contest_id_index", using: "BTREE", order: "ASC", unique: false })
    contestId!: number;
    @Column({ field: "assistant_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    assistantId?: number;
    @Column({ field: "user_id", type: DataType.STRING(60) })
    @Index({ name: "contest_assistant_user_id_index", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
}