import { Response } from 'express';
import { sequelize, User, RaffleSetting, RaffleHistory, PointTransaction } from '../models';
import { AuthRequest } from '../middleware/auth';

// 景品のポイント設定
const PRIZE_POINTS = {
  A: 2000,
  B: 1000,
  C: 500,
};

// 抽選実行
export const drawRaffle = async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user?.id;
    const { prizeType } = req.body;

    if (!userId) {
      await t.rollback();
      return res.status(401).json({ error: '認証が必要です' });
    }

    if (!prizeType || !['A', 'B', 'C'].includes(prizeType)) {
      await t.rollback();
      return res.status(400).json({ error: '有効な景品タイプを選択してください' });
    }

    // Get user
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Check if user has enough points
    const requiredPoints = PRIZE_POINTS[prizeType as 'A' | 'B' | 'C'];
    if (user.points < requiredPoints) {
      await t.rollback();
      return res.status(400).json({
        error: `ポイントが不足しています。${requiredPoints}pt必要です。`,
        requiredPoints,
        currentPoints: user.points,
      });
    }

    // Get win rate for user's rank
    const raffleSetting = await RaffleSetting.findOne({
      where: { rank: user.rank },
      transaction: t,
    });

    const winRate = raffleSetting ? raffleSetting.winRate : 0;

    // Draw random number (0-100)
    const randomValue = Math.random() * 100;
    const won = randomValue < winRate;

    // Deduct points
    user.points -= requiredPoints;
    await user.save({ transaction: t });

    // Create point transaction record
    await PointTransaction.create(
      {
        userId,
        type: 'use',
        amount: requiredPoints,
        description: `${prizeType}賞 抽選参加`,
      },
      { transaction: t }
    );

    // Create raffle history
    const raffleHistory = await RaffleHistory.create(
      {
        userId,
        prizeType: prizeType as 'A' | 'B' | 'C',
        pointsUsed: requiredPoints,
        won,
        userRank: user.rank,
        winRate,
        randomValue,
      },
      { transaction: t }
    );

    await t.commit();

    res.json({
      won,
      prizeType,
      pointsUsed: requiredPoints,
      winRate,
      newBalance: user.points,
      raffleId: raffleHistory.id,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// ユーザーの抽選履歴取得
export const getUserRaffleHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const raffles = await RaffleHistory.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    res.json({ raffles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 管理者：全抽選履歴取得
export const getAllRaffleHistory = async (req: AuthRequest, res: Response) => {
  try {
    const raffles = await RaffleHistory.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'role', 'rank'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    res.json({
      raffles: raffles.map(raffle => ({
        id: raffle.id,
        user: raffle.get('user'),
        prizeType: raffle.prizeType,
        pointsUsed: raffle.pointsUsed,
        won: raffle.won,
        userRank: raffle.userRank,
        winRate: raffle.winRate,
        randomValue: raffle.randomValue,
        createdAt: raffle.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// ランク別当選確率設定取得
export const getRaffleSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await RaffleSetting.findAll({
      order: [
        ['rank', 'ASC'],
      ],
    });

    // 各ランクのデフォルト値を設定
    const ranks = ['bronze', 'silver', 'gold', 'platinum'] as const;
    const settingsMap: Record<string, number> = {};

    ranks.forEach(rank => {
      const setting = settings.find(s => s.rank === rank);
      settingsMap[rank] = setting ? setting.winRate : 0;
    });

    res.json({ settings: settingsMap });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 管理者：ランク別当選確率設定
export const updateRaffleSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: '無効なパラメータです' });
    }

    // Update each rank's win rate
    for (const [rank, winRate] of Object.entries(settings)) {
      if (!['bronze', 'silver', 'gold', 'platinum'].includes(rank)) {
        continue;
      }

      const rate = Number(winRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return res.status(400).json({ error: `${rank}の当選確率は0-100の範囲で設定してください` });
      }

      await RaffleSetting.upsert({
        rank: rank as 'bronze' | 'silver' | 'gold' | 'platinum',
        winRate: rate,
      });
    }

    res.json({ message: '当選確率を更新しました' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 管理者：ユーザーランク更新
export const updateUserRank = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, rank } = req.body;

    if (!userId || !rank) {
      return res.status(400).json({ error: 'ユーザーIDとランクを指定してください' });
    }

    if (!['bronze', 'silver', 'gold', 'platinum'].includes(rank)) {
      return res.status(400).json({ error: '有効なランクを指定してください' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    user.rank = rank;
    await user.save();

    res.json({
      message: `${user.name}のランクを${rank.toUpperCase()}に変更しました`,
      user: {
        id: user.id,
        name: user.name,
        rank: user.rank,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};
