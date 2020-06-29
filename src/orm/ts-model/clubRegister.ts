import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "club_register", timestamps: false })
export class clubRegister extends Model<clubRegister> {
    @Column({ field: "user_id", type: DataType.STRING(48) })
    userId!: string;
    @Column({ type: DataType.STRING(48) })
    name!: string;
    @Column({ type: DataType.TINYINT })
    sex!: number;
    @Column({ type: DataType.STRING(48) })
    class!: string;
    @Column({ field: "mobile_phone", type: DataType.STRING(48) })
    mobilePhone!: string;
    @Column({ type: DataType.STRING(48) })
    qq!: string;
    @Column({ type: DataType.STRING(48) })
    wechat!: string;
    @Column({ type: DataType.CHAR(48) })
    email!: string;
    @Column({ type: DataType.TINYINT })
    club!: number;
}