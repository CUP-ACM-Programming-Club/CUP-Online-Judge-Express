import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "global_setting", timestamps: false })
export class globalSetting extends Model<globalSetting> {
    @Column({ type: DataType.STRING(24) })
    label!: string;
    @Column({ type: DataType.STRING })
    value!: string;
}