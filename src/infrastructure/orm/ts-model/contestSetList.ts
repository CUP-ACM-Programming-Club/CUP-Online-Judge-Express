import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "contest_set_list", timestamps: false })
export class contestSetList extends Model<contestSetList> {
    @Column({ field: "contestset_id", type: DataType.INTEGER })
    contestsetId!: number;
    @Column({ field: "contest_id", type: DataType.INTEGER })
    contestId!: number;
    @Column({ field: "contest_set_record_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    contestSetRecordId?: number;
}