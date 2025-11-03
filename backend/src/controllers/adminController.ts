import { Response } from 'express';
import { sequelize, User, PointTransaction, Like, Setting } from '../models';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'rank', 'points', 'createdAt'],
      order: [['name', 'ASC']],
    });

    res.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        rank: user.rank,
        points: user.points,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const chargePoints = async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  
  try {
    const adminId = req.user?.id;
    const { userId, points, description } = req.body;

    if (!adminId) {
      await t.rollback();
      return res.status(401).json({ error: '認証が必要です' });
    }

    if (!userId || !points || points <= 0) {
      await t.rollback();
      return res.status(400).json({ error: '無効なパラメータです' });
    }

    // Get user
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Update user points
    user.points += points;
    await user.save({ transaction: t });

    // Create transaction record
    await PointTransaction.create(
      {
        userId,
        type: 'charge',
        amount: points,
        description: description || '管理者によるポイントチャージ',
        adminId,
      },
      { transaction: t }
    );

    await t.commit();

    res.json({
      message: 'ポイントをチャージしました',
      user: {
        id: user.id,
        name: user.name,
        newBalance: user.points,
      },
      pointsAdded: points,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      await t.rollback();
      return res.status(400).json({ error: '管理者アカウントは削除できません' });
    }

    // Delete all related data
    await Like.destroy({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      transaction: t,
    });

    await PointTransaction.destroy({
      where: { userId },
      transaction: t,
    });

    // Delete user
    await user.destroy({ transaction: t });

    await t.commit();

    res.json({
      message: 'ユーザーを削除しました',
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getSystemStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.count({
      where: { role: { [Op.ne]: 'admin' } },
    });

    const totalLikes = await Like.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLikes = await Like.count({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    const totalPoints = await User.sum('points', {
      where: { role: { [Op.ne]: 'admin' } },
    });

    res.json({
      stats: {
        totalUsers,
        totalLikes,
        todayLikes,
        totalPoints: totalPoints || 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Admin: Reset user password
export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'ユーザーIDと新しいパスワードを入力してください' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'パスワードは6文字以上で設定してください' });
    }

    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: `${user.name}のパスワードをリセットしました`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get system settings
export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await Setting.findAll();

    const settingsMap: Record<string, string> = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    // Set default values if settings don't exist
    if (!settingsMap.monthlyConversionLimit) {
      settingsMap.monthlyConversionLimit = '3000';
    }

    res.json({ settings: settingsMap });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Update system settings
export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: '無効なパラメータです' });
    }

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await Setting.upsert({
        key,
        value: String(value),
      });
    }

    res.json({ message: '設定を更新しました' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get all likes history (admin only)
export const getAllLikes = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.query;

    let whereClause = {};

    // If userId is provided, filter by that user's sent or received likes
    if (userId) {
      whereClause = {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId },
        ],
      };
    }

    const likes = await Like.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'role'],
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: userId ? undefined : 100, // No limit for individual users, 100 for all
    });

    res.json({
      likes: likes.map(like => ({
        id: like.id,
        sender: like.get('sender'),
        receiver: like.get('receiver'),
        comment: like.comment,
        isConverted: like.isConverted,
        createdAt: like.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};