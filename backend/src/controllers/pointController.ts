import { Response } from 'express';
import { sequelize, User, Like, PointTransaction, Setting } from '../models';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

export const convertLikesToPoints = async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user?.id;
    const { amount } = req.body; // Number of likes to convert

    if (!userId) {
      await t.rollback();
      return res.status(401).json({ error: '認証が必要です' });
    }

    // Get monthly conversion limit from settings
    const limitSetting = await Setting.findOne({ where: { key: 'monthlyConversionLimit' } });
    const monthlyLimit = limitSetting ? parseInt(limitSetting.value) : 3000;

    // Calculate current month's start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get this month's converted points
    const monthlyConversions = await PointTransaction.sum('amount', {
      where: {
        userId,
        type: 'convert',
        createdAt: {
          [Op.between]: [monthStart, monthEnd],
        },
      },
      transaction: t,
    });

    const currentMonthConverted = monthlyConversions || 0;

    // Get unconverted likes
    const unconvertedLikes = await Like.findAll({
      where: {
        receiverId: userId,
        isConverted: false,
      },
      order: [['createdAt', 'ASC']], // Convert oldest first
      transaction: t,
    });

    if (unconvertedLikes.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: '交換可能ないいねがありません' });
    }

    // Determine how many likes to convert
    let likesToConvert = amount && amount > 0 ? Math.min(amount, unconvertedLikes.length) : unconvertedLikes.length;

    // Calculate points (1 like = 100 points)
    const pointsToAdd = likesToConvert * 100;

    // Check if adding these points would exceed monthly limit
    if (currentMonthConverted + pointsToAdd > monthlyLimit) {
      const remainingLimit = monthlyLimit - currentMonthConverted;
      const maxLikesCanConvert = Math.floor(remainingLimit / 100);
      await t.rollback();
      return res.status(400).json({
        error: `今月の変換上限を超えています。残り${remainingLimit}ポイント（${maxLikesCanConvert}個のいいね）まで変換可能です。`,
        monthlyLimit,
        currentMonthConverted,
        remainingLimit,
        maxLikesCanConvert,
      });
    }

    // Get the IDs of likes to convert
    const likeIdsToConvert = unconvertedLikes.slice(0, likesToConvert).map(like => like.id);

    // Update likes as converted
    await Like.update(
      { isConverted: true },
      {
        where: {
          id: { [Op.in]: likeIdsToConvert },
        },
        transaction: t,
      }
    );

    // Update user points
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    user.points += pointsToAdd;
    await user.save({ transaction: t });

    // Create transaction record
    await PointTransaction.create(
      {
        userId,
        type: 'convert',
        amount: pointsToAdd,
        description: `${likesToConvert}個のいいねをポイントに交換`,
      },
      { transaction: t }
    );

    await t.commit();

    res.json({
      message: 'ポイントに交換しました',
      convertedLikes: likesToConvert,
      pointsAdded: pointsToAdd,
      newBalance: user.points,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getPointBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Count unconverted likes
    const unconvertedLikesCount = await Like.count({
      where: {
        receiverId: userId,
        isConverted: false,
      },
    });

    // Get monthly conversion limit from settings
    const limitSetting = await Setting.findOne({ where: { key: 'monthlyConversionLimit' } });
    const monthlyLimit = limitSetting ? parseInt(limitSetting.value) : 3000;

    // Calculate current month's start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get this month's converted points
    const monthlyConversions = await PointTransaction.sum('amount', {
      where: {
        userId,
        type: 'convert',
        createdAt: {
          [Op.between]: [monthStart, monthEnd],
        },
      },
    });

    const currentMonthConverted = monthlyConversions || 0;
    const remainingLimit = monthlyLimit - currentMonthConverted;

    res.json({
      points: user.points,
      unconvertedLikes: unconvertedLikesCount,
      potentialPoints: unconvertedLikesCount * 100,
      monthlyLimit,
      currentMonthConverted,
      remainingLimit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getPointHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const transactions = await PointTransaction.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        admin: t.get('admin'),
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};