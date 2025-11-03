import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RaffleHistoryAttributes {
  id: number;
  userId: number;
  prizeType: 'A' | 'B' | 'C';
  pointsUsed: number;
  won: boolean;
  userRank: 'bronze' | 'silver' | 'gold' | 'platinum';
  winRate: number; // 抽選時の当選確率
  randomValue: number; // 抽選で使用した乱数（監査用）
  createdAt?: Date;
  updatedAt?: Date;
}

interface RaffleHistoryCreationAttributes extends Optional<RaffleHistoryAttributes, 'id'> {}

class RaffleHistory extends Model<RaffleHistoryAttributes, RaffleHistoryCreationAttributes> implements RaffleHistoryAttributes {
  public id!: number;
  public userId!: number;
  public prizeType!: 'A' | 'B' | 'C';
  public pointsUsed!: number;
  public won!: boolean;
  public userRank!: 'bronze' | 'silver' | 'gold' | 'platinum';
  public winRate!: number;
  public randomValue!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RaffleHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    prizeType: {
      type: DataTypes.ENUM('A', 'B', 'C'),
      allowNull: false,
    },
    pointsUsed: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    won: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    userRank: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
      allowNull: false,
    },
    winRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    randomValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'RaffleHistory',
    tableName: 'raffle_histories',
    timestamps: true,
  }
);

export default RaffleHistory;
