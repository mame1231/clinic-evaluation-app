import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RaffleSettingAttributes {
  id: number;
  rank: 'bronze' | 'silver' | 'gold' | 'platinum';
  winRate: number; // 当選確率（%）
  createdAt?: Date;
  updatedAt?: Date;
}

interface RaffleSettingCreationAttributes extends Optional<RaffleSettingAttributes, 'id'> {}

class RaffleSetting extends Model<RaffleSettingAttributes, RaffleSettingCreationAttributes> implements RaffleSettingAttributes {
  public id!: number;
  public rank!: 'bronze' | 'silver' | 'gold' | 'platinum';
  public winRate!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RaffleSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rank: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
      allowNull: false,
      unique: true,
    },
    winRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    sequelize,
    modelName: 'RaffleSetting',
    tableName: 'raffle_settings',
    timestamps: true,
  }
);

export default RaffleSetting;
