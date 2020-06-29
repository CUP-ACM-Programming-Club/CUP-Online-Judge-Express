import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "contest_cheat", timestamps: false })
export class contestCheat extends Model<contestCheat> {
    @Column({ field: "contest_id", type: DataType.INTEGER })
    @Index({ name: "contest_cheat_contest_id_index", using: "BTREE", order: "DESC", unique: false })
    contestId!: number;
    @Column({ field: "solution_id", primaryKey: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    solutionId!: number;
    @Column({ field: "user_id", type: DataType.STRING(48) })
    @Index({ name: "contest_cheat_user_id_index", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ type: DataType.INTEGER })
    num!: number;
    @Column({ type: DataType.TINYINT })
    checked!: number;
}