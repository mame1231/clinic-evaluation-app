import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';

const generateToken = (userId: number): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: '既に登録済みです' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'office',
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: '登録が完了しました',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが間違っています' });
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが間違っています' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'ログインしました',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        points: req.user.points,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Change password (for logged-in users)
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '現在のパスワードと新しいパスワードを入力してください' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'パスワードは6文字以上で設定してください' });
    }

    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Validate current password
    const isPasswordValid = await user.validatePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '現在のパスワードが間違っています' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'パスワードを変更しました',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Reset password by email (for forgot password)
export const resetPasswordByEmail = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'メールアドレスと新しいパスワードを入力してください' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'パスワードは6文字以上で設定してください' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'メールアドレスが見つかりません' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'パスワードをリセットしました',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};