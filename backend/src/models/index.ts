import sequelize from '../config/database';
import User from './User';
import Like from './Like';
import PointTransaction from './PointTransaction';
import Setting from './Setting';
import RaffleSetting from './RaffleSetting';
import RaffleHistory from './RaffleHistory';

// Define associations
User.hasMany(Like, {
  foreignKey: 'senderId',
  as: 'sentLikes',
});

User.hasMany(Like, {
  foreignKey: 'receiverId',
  as: 'receivedLikes',
});

Like.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender',
});

Like.belongsTo(User, {
  foreignKey: 'receiverId',
  as: 'receiver',
});

User.hasMany(PointTransaction, {
  foreignKey: 'userId',
  as: 'pointTransactions',
});

PointTransaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

PointTransaction.belongsTo(User, {
  foreignKey: 'adminId',
  as: 'admin',
});

User.hasMany(RaffleHistory, {
  foreignKey: 'userId',
  as: 'raffleHistories',
});

RaffleHistory.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { sequelize, User, Like, PointTransaction, Setting, RaffleSetting, RaffleHistory };