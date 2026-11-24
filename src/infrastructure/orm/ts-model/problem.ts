import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "problem", timestamps: false })
export class problem extends Model<problem> {
    @Column({ field: "problem_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    @Index({ name: "problem_defunct_problem_id_index", using: "BTREE", order: "ASC", unique: false })
    problemId?: number;
    @Column({ type: DataType.STRING(200) })
    title!: string;
    @Column({ allowNull: true, type: DataType.STRING })
    description?: string;
    @Column({ allowNull: true, type: DataType.STRING })
    input?: string;
    @Column({ allowNull: true, type: DataType.STRING })
    output?: string;
    @Column({ field: "sample_input", allowNull: true, type: DataType.STRING })
    sampleInput?: string;
    @Column({ field: "sample_output", allowNull: true, type: DataType.STRING })
    sampleOutput?: string;
    @Column({ type: DataType.CHAR(1) })
    spj!: string;
    @Column({ allowNull: true, type: DataType.STRING })
    hint?: string;
    @Column({ allowNull: true, type: DataType.STRING(100) })
    source?: string;
    @Column({ allowNull: true, type: DataType.STRING(100) })
    label?: string;
    @Column({ field: "in_date", allowNull: true, type: DataType.DATE })
    @Index({ name: "problem_defunct_in_date_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "problem_defunct_in_date_index_2", using: "BTREE", order: "DESC", unique: false })
    inDate?: Date;
    @Column({ field: "time_limit", type: DataType.DOUBLE(22) })
    timeLimit!: number;
    @Column({ field: "memory_limit", type: DataType.INTEGER })
    memoryLimit!: number;
    @Column({ type: DataType.CHAR(1) })
    @Index({ name: "problem_defunct_in_date_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "problem_defunct_in_date_index_2", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "problem_defunct_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "problem_defunct_problem_id_index", using: "BTREE", order: "ASC", unique: false })
    defunct!: string;
    @Column({ allowNull: true, type: DataType.INTEGER })
    @Index({ name: "problem_accepted_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "problem_accepted_index_2", using: "BTREE", order: "DESC", unique: false })
    accepted?: number;
    @Column({ allowNull: true, type: DataType.INTEGER })
    @Index({ name: "problem_submit_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "problem_submit_index_2", using: "BTREE", order: "DESC", unique: false })
    submit?: number;
    @Column({ allowNull: true, type: DataType.INTEGER })
    solved?: number;
    @Column({ field: "fill_in_blank_problem", type: DataType.INTEGER })
    fillInBlankProblem!: number;
}