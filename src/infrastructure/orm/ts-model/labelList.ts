import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "label_list", timestamps: false })
export class labelList extends Model<labelList> {
    @Column({ field: "label_name", type: DataType.STRING(20) })
    @Index({ name: "label_list_label_name_index", using: "BTREE", order: "ASC", unique: false })
    labelName!: string;
    @Column({ field: "label_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    labelId?: number;
    @Column({ field: "prev_label_id", type: DataType.INTEGER })
    prevLabelId!: number;
}