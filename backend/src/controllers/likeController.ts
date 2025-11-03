import { Response } from 'express';
import { Op } from 'sequelize';
import { Like, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { GoogleSheetsService } from '../services/googleSheetsService';

export const sendLike = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, comment } = req.body;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // Check if receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Check if sender is trying to send to themselves
    if (senderId === receiverId) {
      return res.status(400).json({ error: '自分にいいねを送ることはできません' });
    }

    // Check if 30 minutes have passed since last like
    const lastLike = await Like.findOne({
      where: { senderId },
      order: [['createdAt', 'DESC']],
    });

    if (lastLike) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (lastLike.createdAt! > thirtyMinutesAgo) {
        const remainingTime = Math.ceil((lastLike.createdAt!.getTime() + 30 * 60 * 1000 - Date.now()) / 60000);
        return res.status(400).json({
          error: `次のいいねまであと${remainingTime}分待つ必要があります`,
          remainingMinutes: remainingTime
        });
      }
    }

    // Check today's send count (max 5 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLikesCount = await Like.count({
      where: {
        senderId,
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    if (todayLikesCount >= 5) {
      return res.status(400).json({ error: '本日の送信上限に達しました' });
    }

    // Check if already sent to this person today
    const existingLike = await Like.findOne({
      where: {
        senderId,
        receiverId,
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    if (existingLike) {
      return res.status(400).json({ error: 'この方には既にいいねを送信済みです' });
    }

    // Create like
    const like = await Like.create({
      senderId,
      receiverId,
      comment,
    });

    // Send to Google Sheets
    try {
      const googleSheets = new GoogleSheetsService();
      await googleSheets.addLikeRecord({
        date: like.createdAt!,
        senderName: req.user!.name,
        receiverName: receiver.name,
        comment,
      });
    } catch (error) {
      console.error('Google Sheets error:', error);
      // Continue even if Google Sheets fails
    }

    res.status(201).json({
      message: 'いいねを送信しました',
      like: {
        id: like.id,
        receiverId: like.receiverId,
        comment: like.comment,
        createdAt: like.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getReceivedLikes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const likes = await Like.findAll({
      where: { receiverId: userId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Count new likes (not converted to points)
    const newLikesCount = likes.filter(like => !like.isConverted).length;

    res.json({
      likes: likes.map(like => ({
        id: like.id,
        comment: like.comment,
        isConverted: like.isConverted,
        createdAt: like.createdAt,
        sender: like.get('sender'),
      })),
      newLikesCount,
      totalCount: likes.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getSentLikes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const likes = await Like.findAll({
      where: { senderId: userId },
      include: [
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      likes: likes.map(like => ({
        id: like.id,
        comment: like.comment,
        createdAt: like.createdAt,
        receiver: like.get('receiver'),
      })),
      totalCount: likes.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getAvailableReceivers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // Get all users except self and admin
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: userId },
        role: { [Op.ne]: 'admin' },
      },
      attributes: ['id', 'name', 'role'],
      order: [['name', 'ASC']],
    });

    // Get today's sent likes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySentLikes = await Like.findAll({
      where: {
        senderId: userId,
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
      attributes: ['receiverId'],
    });

    const sentToday = new Set(todaySentLikes.map(like => like.receiverId));

    // Check if 30 minutes have passed since last like
    const lastLike = await Like.findOne({
      where: { senderId: userId },
      order: [['createdAt', 'DESC']],
    });

    let nextAvailableTime: Date | null = null;
    let remainingMinutes = 0;

    if (lastLike) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (lastLike.createdAt! > thirtyMinutesAgo) {
        nextAvailableTime = new Date(lastLike.createdAt!.getTime() + 30 * 60 * 1000);
        remainingMinutes = Math.ceil((nextAvailableTime.getTime() - Date.now()) / 60000);
      }
    }

    res.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        role: user.role,
        canSend: !sentToday.has(user.id),
      })),
      remainingToday: 5 - todaySentLikes.length,
      nextAvailableTime,
      remainingMinutes,
      canSendNow: remainingMinutes === 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};