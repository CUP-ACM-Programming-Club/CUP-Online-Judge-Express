import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "special_subject", timestamps: false })
export class specialSubject extends Model<specialSubject> {
    @Column({ field: "topic_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    topicId?: number;
    @Column({ type: DataType.STRING(255) })
    @Index({ name: "special_subject_title_pk", using: "BTREE", order: "ASC", unique: true })
    title!: string;
    @Column({ type: DataType.CHAR(1) })
    defunct!: string;
    @Column({ type: DataType.STRING })
    description!: string;
    @Column({ type: DataType.TINYINT })
    private!: number;
    @Column({ type: DataType.TINYINT })
    vjudge!: number;
    @Column({ type: DataType.INTEGER })
    langmask!: number;
    @Column({ type: DataType.CHAR(16) })
    password!: string;
}