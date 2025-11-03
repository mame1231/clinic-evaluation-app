import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { raffleService } from '../services/raffleService';
import { User, RaffleSettings, RaffleHistory } from '../types';
import '../styles/Admin.css';

interface SystemStats {
  totalUsers: number;
  totalLikes: number;
  todayLikes: number;
  totalPoints: number;
}

interface LikeHistory {
  id: number;
  sender: { id: number; name: string; role: string };
  receiver: { id: number; name: string; role: string };
  comment: string;
  isConverted: boolean;
  createdAt: string;
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'likes' | 'settings' | 'raffle'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [likes, setLikes] = useState<LikeHistory[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedLikeUser, setSelectedLikeUser] = useState<string>('');
  const [chargePoints, setChargePoints] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settingsModalUser, setSettingsModalUser] = useState<User | null>(null);
  const [systemSettings, setSystemSettings] = useState({ monthlyConversionLimit: '3000' });
  const [raffleSettings, setRaffleSettings] = useState<RaffleSettings>({ bronze: 0, silver: 0, gold: 0, platinum: 0 });
  const [raffleHistory, setRaffleHistory] = useState<RaffleHistory[]>([]);
  const [pendingRankChanges, setPendingRankChanges] = useState<Record<number, 'bronze' | 'silver' | 'gold' | 'platinum'>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, statsRes, settingsRes, likesRes, raffleSettingsData, raffleHistoryData] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
        api.get('/admin/settings'),
        api.get('/admin/likes'),
        raffleService.getSettings(),
        raffleService.getAllHistory(),
      ]);

      setUsers(usersRes.data.users);
      setStats(statsRes.data.stats);
      setSystemSettings(settingsRes.data.settings);
      setLikes(likesRes.data.likes);
      setRaffleSettings(raffleSettingsData);
      setRaffleHistory(raffleHistoryData);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'データの読み込みに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const loadLikesForUser = async (userId: string) => {
    try {
      const url = userId ? `/admin/likes?userId=${userId}` : '/admin/likes';
      const response = await api.get(url);
      setLikes(response.data.likes);
    } catch (error) {
      console.error('Error loading likes:', error);
      setMessage({ type: 'error', text: 'いいね履歴の読み込みに失敗しました' });
    }
  };

  const handleSaveSettings = async () => {
    setProcessing(true);
    setMessage(null);

    try {
      await api.put('/admin/settings', {
        settings: systemSettings,
      });

      setMessage({ type: 'success', text: '設定を保存しました' });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || '設定の保存に失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setProcessing(false);
    }
  };

  const handleChargePoints = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !chargePoints) {
      setMessage({ type: 'error', text: 'ユーザーとポイント数を入力してください' });
      return;
    }

    const points = parseInt(chargePoints);
    if (isNaN(points) || points <= 0) {
      setMessage({ type: 'error', text: '有効なポイント数を入力してください' });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      await api.post('/admin/charge-points', {
        userId: selectedUser,
        points,
        description: chargeDescription || undefined,
      });

      setMessage({ type: 'success', text: 'ポイントをチャージしました' });
      setSelectedUser(null);
      setChargePoints('');
      setChargeDescription('');

      // Reload data
      await loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'ポイントチャージに失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setProcessing(false);
    }
  };

  const openSettingsModal = (user: User) => {
    setSettingsModalUser(user);
  };

  const closeSettingsModal = () => {
    setSettingsModalUser(null);
  };

  const handleResetPassword = async () => {
    if (!settingsModalUser) return;

    const newPassword = window.prompt(`${settingsModalUser.name} の新しいパスワードを入力してください（6文字以上）:`);

    if (!newPassword) {
      return; // User cancelled
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'パスワードは6文字以上で設定してください' });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      await api.post('/admin/reset-password', {
        userId: settingsModalUser.id,
        newPassword,
      });

      setMessage({ type: 'success', text: `${settingsModalUser.name} のパスワードをリセットしました` });
      closeSettingsModal();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'パスワードリセットに失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!settingsModalUser) return;

    if (!window.confirm(`本当に ${settingsModalUser.name} を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      await api.delete(`/admin/users/${settingsModalUser.id}`);
      setMessage({ type: 'success', text: 'ユーザーを削除しました' });
      closeSettingsModal();

      // Reload data
      await loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'ユーザー削除に失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveRaffleSettings = async () => {
    setProcessing(true);
    setMessage(null);

    try {
      await raffleService.updateSettings(raffleSettings);
      setMessage({ type: 'success', text: '懸賞設定を保存しました' });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || '懸賞設定の保存に失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setProcessing(false);
    }
  };

  const handleRankChange = (userId: number, rank: 'bronze' | 'silver' | 'gold' | 'platinum') => {
    setPendingRankChanges(prev => ({ ...prev, [userId]: rank }));
  };

  const handleSaveRankChange = async (userId: number) => {
    const newRank = pendingRankChanges[userId];
    if (!newRank) return;

    setProcessing(true);
    setMessage(null);

    try {
      await raffleService.updateUserRank(userId, newRank);
      setMessage({ type: 'success', text: 'ユーザーランクを更新しました' });

      // Remove from pending changes
      setPendingRankChanges(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      // Reload data
      await loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'ランク更新に失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setProcessing(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'nurse':
        return '看護師';
      case 'office':
        return '事務';
      default:
        return role;
    }
  };

  const getRankLabel = (rank: string) => {
    switch (rank) {
      case 'bronze':
        return 'ブロンズ';
      case 'silver':
        return 'シルバー';
      case 'gold':
        return 'ゴールド';
      case 'platinum':
        return 'プラチナ';
      default:
        return rank;
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="admin-container">
      <header className="page-header">
        <h1>管理者ページ</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← 戻る
        </button>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 概要・ユーザー管理
        </button>
        <button
          className={`tab ${activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          💙 いいね履歴
        </button>
        <button
          className={`tab ${activeTab === 'raffle' ? 'active' : ''}`}
          onClick={() => setActiveTab('raffle')}
        >
          🎁 懸賞管理
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ システム設定
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* System Stats */}
          <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">本日のいいね数</div>
          <div className="stat-value highlight">{stats?.todayLikes || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">総いいね数</div>
          <div className="stat-value">{stats?.totalLikes || 0}</div>
        </div>
      </div>
        </>
      )}

      {/* Likes History Tab */}
      {activeTab === 'likes' && (
        <div className="likes-section">
          <div className="likes-header">
            <h2>{selectedLikeUser ? 'ユーザー別いいね履歴' : 'いいね履歴（最新100件）'}</h2>
            <div className="user-filter">
              <label htmlFor="like-user-select">ユーザーで絞り込み:</label>
              <select
                id="like-user-select"
                value={selectedLikeUser}
                onChange={(e) => {
                  setSelectedLikeUser(e.target.value);
                  loadLikesForUser(e.target.value);
                }}
              >
                <option value="">すべて（最新100件）</option>
                {users.filter(u => u.role !== 'admin').map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({getRoleLabel(user.role)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedLikeUser ? (
            // ユーザー別表示：送信と受信を分ける
            <>
              <div className="likes-subsection">
                <h3>📤 送信したいいね</h3>
                <div className="likes-table-container">
                  <table className="likes-table">
                    <thead>
                      <tr>
                        <th>送信日時</th>
                        <th>受信者</th>
                        <th>コメント</th>
                      </tr>
                    </thead>
                    <tbody>
                      {likes.filter(like => like.sender.id === Number(selectedLikeUser)).map((like) => (
                        <tr key={like.id}>
                          <td>{formatDateTime(like.createdAt)}</td>
                          <td>
                            <div className="user-cell">
                              <span className="user-name">{like.receiver.name}</span>
                              <span className={`role-badge ${like.receiver.role}`}>
                                {getRoleLabel(like.receiver.role)}
                              </span>
                            </div>
                          </td>
                          <td className="comment-cell">{like.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {likes.filter(like => like.sender.id === Number(selectedLikeUser)).length === 0 && (
                    <div className="empty-state">送信したいいねがありません</div>
                  )}
                </div>
              </div>

              <div className="likes-subsection">
                <h3>📬 受信したいいね</h3>
                <div className="likes-table-container">
                  <table className="likes-table">
                    <thead>
                      <tr>
                        <th>受信日時</th>
                        <th>送信者</th>
                        <th>コメント</th>
                      </tr>
                    </thead>
                    <tbody>
                      {likes.filter(like => like.receiver.id === Number(selectedLikeUser)).map((like) => (
                        <tr key={like.id}>
                          <td>{formatDateTime(like.createdAt)}</td>
                          <td>
                            <div className="user-cell">
                              <span className="user-name">{like.sender.name}</span>
                              <span className={`role-badge ${like.sender.role}`}>
                                {getRoleLabel(like.sender.role)}
                              </span>
                            </div>
                          </td>
                          <td className="comment-cell">{like.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {likes.filter(like => like.receiver.id === Number(selectedLikeUser)).length === 0 && (
                    <div className="empty-state">受信したいいねがありません</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // 全体表示：通常通り
            <div className="likes-table-container">
              <table className="likes-table">
                <thead>
                  <tr>
                    <th>送信日時</th>
                    <th>送信者</th>
                    <th>受信者</th>
                    <th>コメント</th>
                  </tr>
                </thead>
                <tbody>
                  {likes.map((like) => (
                    <tr key={like.id}>
                      <td>{formatDateTime(like.createdAt)}</td>
                      <td>
                        <div className="user-cell">
                          <span className="user-name">{like.sender.name}</span>
                          <span className={`role-badge ${like.sender.role}`}>
                            {getRoleLabel(like.sender.role)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="user-cell">
                          <span className="user-name">{like.receiver.name}</span>
                          <span className={`role-badge ${like.receiver.role}`}>
                            {getRoleLabel(like.receiver.role)}
                          </span>
                        </div>
                      </td>
                      <td className="comment-cell">{like.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {likes.length === 0 && (
                <div className="empty-state">まだいいねがありません</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Raffle Tab */}
      {activeTab === 'raffle' && (
        <>
          <div className="raffle-settings-section">
            <h2>🎯 ランク別当選確率設定</h2>
            <div className="raffle-settings-grid">
              <div className="raffle-setting-item">
                <label htmlFor="bronze-rate">🥉 ブロンズ</label>
                <div className="input-with-unit">
                  <input
                    id="bronze-rate"
                    type="number"
                    value={raffleSettings.bronze}
                    onChange={(e) => setRaffleSettings({ ...raffleSettings, bronze: Number(e.target.value) })}
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={processing}
                  />
                  <span className="unit">%</span>
                </div>
              </div>

              <div className="raffle-setting-item">
                <label htmlFor="silver-rate">🥈 シルバー</label>
                <div className="input-with-unit">
                  <input
                    id="silver-rate"
                    type="number"
                    value={raffleSettings.silver}
                    onChange={(e) => setRaffleSettings({ ...raffleSettings, silver: Number(e.target.value) })}
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={processing}
                  />
                  <span className="unit">%</span>
                </div>
              </div>

              <div className="raffle-setting-item">
                <label htmlFor="gold-rate">🥇 ゴールド</label>
                <div className="input-with-unit">
                  <input
                    id="gold-rate"
                    type="number"
                    value={raffleSettings.gold}
                    onChange={(e) => setRaffleSettings({ ...raffleSettings, gold: Number(e.target.value) })}
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={processing}
                  />
                  <span className="unit">%</span>
                </div>
              </div>

              <div className="raffle-setting-item">
                <label htmlFor="platinum-rate">💎 プラチナ</label>
                <div className="input-with-unit">
                  <input
                    id="platinum-rate"
                    type="number"
                    value={raffleSettings.platinum}
                    onChange={(e) => setRaffleSettings({ ...raffleSettings, platinum: Number(e.target.value) })}
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={processing}
                  />
                  <span className="unit">%</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveRaffleSettings}
              className="save-settings-btn"
              disabled={processing}
            >
              {processing ? '保存中...' : '当選確率を保存'}
            </button>
          </div>

          <div className="user-ranks-section">
            <h2>👥 ユーザーランク管理</h2>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>名前</th>
                    <th>役割</th>
                    <th>現在のランク</th>
                    <th>ランク変更</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role !== 'admin').map((user) => {
                    const hasPendingChange = pendingRankChanges[user.id] !== undefined;
                    const displayRank = hasPendingChange ? pendingRankChanges[user.id] : user.rank;

                    return (
                      <tr key={user.id} className={hasPendingChange ? 'has-pending-change' : ''}>
                        <td>{user.name}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td>
                          <span className={`rank-badge ${user.rank}`}>
                            {getRankLabel(user.rank)}
                          </span>
                        </td>
                        <td>
                          <select
                            value={displayRank}
                            onChange={(e) => handleRankChange(user.id, e.target.value as any)}
                            disabled={processing}
                            className="rank-select"
                          >
                            <option value="bronze">🥉 ブロンズ</option>
                            <option value="silver">🥈 シルバー</option>
                            <option value="gold">🥇 ゴールド</option>
                            <option value="platinum">💎 プラチナ</option>
                          </select>
                        </td>
                        <td>
                          <button
                            onClick={() => handleSaveRankChange(user.id)}
                            disabled={!hasPendingChange || processing}
                            className="save-rank-btn"
                          >
                            {processing ? '保存中...' : '保存'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="raffle-history-section">
            <h2>📜 抽選履歴</h2>
            {raffleHistory.length === 0 ? (
              <div className="empty-state">まだ抽選履歴がありません</div>
            ) : (
              <div className="raffle-history-table-container">
                <table className="raffle-history-table">
                  <thead>
                    <tr>
                      <th>日時</th>
                      <th>ユーザー</th>
                      <th>景品</th>
                      <th>使用ポイント</th>
                      <th>ランク</th>
                      <th>当選確率</th>
                      <th>結果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffleHistory.map((raffle) => (
                      <tr key={raffle.id}>
                        <td>{formatDateTime(raffle.createdAt)}</td>
                        <td>
                          {raffle.user ? (
                            <div className="user-cell">
                              <span className="user-name">{raffle.user.name}</span>
                              <span className={`role-badge ${raffle.user.role}`}>
                                {getRoleLabel(raffle.user.role)}
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="prize-cell">{raffle.prizeType}賞</td>
                        <td className="points-cell">{raffle.pointsUsed} pt</td>
                        <td>
                          <span className={`rank-badge ${raffle.userRank}`}>
                            {getRankLabel(raffle.userRank)}
                          </span>
                        </td>
                        <td>{raffle.winRate}%</td>
                        <td>
                          <span className={`result-badge ${raffle.won ? 'won' : 'lost'}`}>
                            {raffle.won ? '✅ 当選' : '❌ 外れ'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <>
          <div className="settings-section">
            <h2>ポイント上限設定</h2>
            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="monthly-limit">月間ポイント変換上限</label>
                <input
                  id="monthly-limit"
                  type="number"
                  value={systemSettings.monthlyConversionLimit}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    monthlyConversionLimit: e.target.value,
                  })}
                  placeholder="3000"
                  min="0"
                  disabled={processing}
                />
                <p className="form-help">
                  ユーザーが1ヶ月に変換できるいいね→ポイントの上限を設定します
                </p>
              </div>

              <button
                onClick={handleSaveSettings}
                className="save-settings-btn"
                disabled={processing}
              >
                {processing ? '保存中...' : '設定を保存'}
              </button>
            </div>
          </div>

          <div className="charge-section">
            <h2>ポイントチャージ</h2>
            <form onSubmit={handleChargePoints} className="charge-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="user-select">ユーザー選択</label>
                  <select
                    id="user-select"
                    value={selectedUser || ''}
                    onChange={(e) => setSelectedUser(Number(e.target.value))}
                    disabled={processing}
                  >
                    <option value="">選択してください</option>
                    {users.filter(u => u.role !== 'admin').map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({getRoleLabel(user.role)}) - 現在: {user.points}pt
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="points-input">チャージポイント</label>
                  <input
                    id="points-input"
                    type="number"
                    value={chargePoints}
                    onChange={(e) => setChargePoints(e.target.value)}
                    placeholder="100"
                    min="1"
                    disabled={processing}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description-input">説明（任意）</label>
                <input
                  id="description-input"
                  type="text"
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  placeholder="例: 特別ボーナス"
                  disabled={processing}
                />
              </div>

              <button type="submit" className="charge-btn" disabled={processing}>
                {processing ? 'チャージ中...' : 'ポイントをチャージ'}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Users List (always visible on overview tab, moved inside) */}
      {activeTab === 'overview' && (
        <div className="users-section">
        <h2>ユーザー一覧</h2>
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>役割</th>
                <th>ポイント</th>
                <th>設定</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="points-cell">{user.points} pt</td>
                  <td>
                    {user.role !== 'admin' ? (
                      <button
                        onClick={() => openSettingsModal(user)}
                        className="settings-btn"
                        disabled={processing}
                        title="設定"
                      >
                        ⚙️ 編集
                      </button>
                    ) : (
                      <span className="no-action">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModalUser && (
        <div className="modal-overlay" onClick={closeSettingsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ {settingsModalUser.name} の設定</h2>
              <button className="modal-close" onClick={closeSettingsModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="user-info">
                <p><strong>メール:</strong> {settingsModalUser.email}</p>
                <p><strong>登録日:</strong> {formatDate(settingsModalUser.createdAt!)}</p>
              </div>
              <div className="modal-actions">
                <button
                  onClick={handleResetPassword}
                  className="modal-reset-btn"
                  disabled={processing}
                >
                  🔑 パスワードをリセット
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="modal-delete-btn"
                  disabled={processing}
                >
                  🗑️ ユーザーを削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
