import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface SettingAttributes {
  id: number;
  key: string;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Setting extends Model<SettingAttributes> implements SettingAttributes {
  public id!: number;
  public key!: string;
  public value!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Setting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
  }
);

export default Setting;
