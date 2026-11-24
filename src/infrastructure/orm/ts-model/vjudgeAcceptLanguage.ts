import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "vjudge_accept_language", timestamps: false })
export class vjudgeAcceptLanguage extends Model<vjudgeAcceptLanguage> {
    @Column({ field: "problem_id", type: DataType.INTEGER })
    problemId!: number;
    @Column({ field: "accept_language", type: DataType.STRING })
    acceptLanguage!: string;
    @Column({ type: DataType.STRING(12) })
    source!: string;
}