import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface LikeAttributes {
  id: number;
  senderId: number;
  receiverId: number;
  comment: string;
  isConverted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LikeCreationAttributes extends Optional<LikeAttributes, 'id' | 'isConverted'> {}

class Like extends Model<LikeAttributes, LikeCreationAttributes> implements LikeAttributes {
  public id!: number;
  public senderId!: number;
  public receiverId!: number;
  public comment!: string;
  public isConverted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Like.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isConverted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Like',
    tableName: 'likes',
    indexes: [
      {
        fields: ['senderId', 'receiverId', 'createdAt'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default Like;