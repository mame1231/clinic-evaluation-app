import api from './api';
import { RaffleHistory, RaffleSettings } from '../types';

export interface DrawRaffleRequest {
  prizeType: 'A' | 'B' | 'C';
}

export interface DrawRaffleResponse {
  won: boolean;
  prizeType: 'A' | 'B' | 'C';
  pointsUsed: number;
  winRate: number;
  newBalance: number;
  raffleId: number;
}

export const raffleService = {
  // 抽選実行
  async drawRaffle(data: DrawRaffleRequest): Promise<DrawRaffleResponse> {
    const response = await api.post('/raffle/draw', data);
    return response.data;
  },

  // 抽選履歴取得
  async getHistory(): Promise<RaffleHistory[]> {
    const response = await api.get('/raffle/history');
    return response.data.raffles;
  },

  // 当選確率設定取得
  async getSettings(): Promise<RaffleSettings> {
    const response = await api.get('/raffle/settings');
    return response.data.settings;
  },

  // 管理者: 全抽選履歴取得
  async getAllHistory(): Promise<RaffleHistory[]> {
    const response = await api.get('/raffle/admin/history');
    return response.data.raffles;
  },

  // 管理者: 当選確率設定更新
  async updateSettings(settings: RaffleSettings): Promise<void> {
    await api.put('/raffle/admin/settings', { settings });
  },

  // 管理者: ユーザーランク更新
  async updateUserRank(userId: number, rank: 'bronze' | 'silver' | 'gold' | 'platinum'): Promise<void> {
    await api.put('/raffle/admin/user-rank', { userId, rank });
  },
};
