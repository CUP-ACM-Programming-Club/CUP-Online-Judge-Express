import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "contest_clarification", timestamps: false })
export class contestClarification extends Model<contestClarification> {
    @Column({ field: "contest_id", type: DataType.INTEGER })
    contestId!: number;
    @Column({ type: DataType.STRING })
    content!: string;
    @Column({ allowNull: true, type: DataType.DATE })
    time?: Date;
    @Column({ field: "discuss_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    discussId?: number;
}