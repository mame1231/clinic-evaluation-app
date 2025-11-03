export interface User {
  id: number;
  name: string;
  email: string;
  role: 'nurse' | 'office' | 'admin';
  rank: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  createdAt?: string;
}

export interface Like {
  id: number;
  comment: string;
  isConverted?: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface PointTransaction {
  id: number;
  type: 'charge' | 'convert' | 'use';
  amount: number;
  description: string;
  admin?: User;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface AvailableReceiver {
  id: number;
  name: string;
  role: 'nurse' | 'office';
  canSend: boolean;
}

export interface RaffleHistory {
  id: number;
  user?: User;
  prizeType: 'A' | 'B' | 'C';
  pointsUsed: number;
  won: boolean;
  userRank: 'bronze' | 'silver' | 'gold' | 'platinum';
  winRate: number;
  randomValue: number;
  createdAt: string;
}

export interface RaffleSettings {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}