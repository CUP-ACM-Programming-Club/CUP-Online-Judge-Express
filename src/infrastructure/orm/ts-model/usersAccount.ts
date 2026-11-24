import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "users_account", timestamps: false })
export class usersAccount extends Model<usersAccount> {
    @Column({ field: "user_id", type: DataType.STRING(48) })
    userId!: string;
    @Column({ allowNull: true, type: DataType.STRING(48) })
    hdu?: string;
    @Column({ allowNull: true, type: DataType.STRING(48) })
    poj?: string;
    @Column({ allowNull: true, type: DataType.STRING(48) })
    codeforces?: string;
    @Column({ allowNull: true, type: DataType.STRING(48) })
    uva?: string;
    @Column({ allowNull: true, type: DataType.STRING(48) })
    vjudge?: string;
    @Column({ field: "hustoj-upc", allowNull: true, type: DataType.STRING(48) })
    hustojUpc?: string;
    @Column({ allowNull: true, type: DataType.STRING(48) })
    upcvj?: string;
    @Column({ allowNull: true, type: DataType.STRING(48) })
    cup?: string;
}