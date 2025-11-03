import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PointTransactionAttributes {
  id: number;
  userId: number;
  type: 'charge' | 'convert' | 'use';
  amount: number;
  description: string;
  adminId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PointTransactionCreationAttributes extends Optional<PointTransactionAttributes, 'id' | 'adminId'> {}

class PointTransaction extends Model<PointTransactionAttributes, PointTransactionCreationAttributes> implements PointTransactionAttributes {
  public id!: number;
  public userId!: number;
  public type!: 'charge' | 'convert' | 'use';
  public amount!: number;
  public description!: string;
  public adminId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PointTransaction.init(
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
    type: {
      type: DataTypes.ENUM('charge', 'convert', 'use'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'PointTransaction',
    tableName: 'point_transactions',
    indexes: [
      {
        fields: ['userId', 'createdAt'],
      },
    ],
  }
);

export default PointTransaction;