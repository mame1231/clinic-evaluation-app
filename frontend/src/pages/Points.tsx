import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PointTransaction } from '../types';
import '../styles/Points.css';

interface PointBalance {
  points: number;
  unconvertedLikes: number;
  potentialPoints: number;
  monthlyLimit: number;
  currentMonthConverted: number;
  remainingLimit: number;
}

const Points: React.FC = () => {
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [convertAmount, setConvertAmount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceRes, historyRes] = await Promise.all([
        api.get('/points/balance'),
        api.get('/points/history'),
      ]);

      setBalance(balanceRes.data);
      setTransactions(historyRes.data.transactions);
      // Set default convert amount to all unconverted likes
      setConvertAmount(balanceRes.data.unconvertedLikes || 0);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!balance || balance.unconvertedLikes === 0 || convertAmount <= 0) {
      return;
    }

    setConverting(true);
    setMessage(null);

    try {
      const response = await api.post('/points/convert', { amount: convertAmount });
      setMessage({
        type: 'success',
        text: `${response.data.convertedLikes}個のいいねを${response.data.pointsAdded}ポイントに交換しました！`,
      });

      // Reload data
      await loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'ポイント交換に失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setConverting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'charge':
        return 'チャージ';
      case 'convert':
        return '交換';
      case 'use':
        return '使用';
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="points-container">
      <header className="page-header">
        <h1>ポイント管理</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← 戻る
        </button>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="points-summary">
        <div className="balance-card">
          <h2>現在のポイント</h2>
          <div className="balance-value">{balance?.points || 0} pt</div>
        </div>

        <div className="convert-card">
          <h3>未交換のいいね</h3>
          <div className="convert-info">
            <div className="likes-count">{balance?.unconvertedLikes || 0}個</div>
          </div>

          {balance && balance.unconvertedLikes > 0 && (
            <div className="convert-amount-section">
              <label htmlFor="convertAmount">交換する数を選択:</label>
              <div className="amount-controls">
                <input
                  type="range"
                  id="convertSlider"
                  min="1"
                  max={balance.unconvertedLikes}
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(parseInt(e.target.value))}
                  className="convert-slider"
                  disabled={converting}
                />
                <input
                  type="number"
                  id="convertAmount"
                  min="1"
                  max={balance.unconvertedLikes}
                  value={convertAmount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= balance.unconvertedLikes) {
                      setConvertAmount(val);
                    }
                  }}
                  className="convert-number-input"
                  disabled={converting}
                />
                <span className="unit-text">個</span>
              </div>
              <div className="convert-preview">
                <span className="preview-amount">{convertAmount}個</span>
                <span className="arrow">→</span>
                <span className="preview-points">{convertAmount * 100}pt</span>
              </div>
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={converting || !balance || balance.unconvertedLikes === 0 || balance.remainingLimit <= 0 || convertAmount <= 0}
            className="convert-btn"
          >
            {converting ? '交換中...' : 'ポイントに交換する'}
          </button>
          {balance && balance.unconvertedLikes === 0 && (
            <p className="no-likes-text">交換可能ないいねがありません</p>
          )}
          {balance && balance.remainingLimit <= 0 && (
            <p className="no-likes-text warning">今月の変換上限に達しています</p>
          )}
        </div>
      </div>

      {/* Monthly Limit Info */}
      {balance && (
        <div className="monthly-limit-card">
          <h3>📊 今月のポイント変換状況</h3>
          <div className="limit-info">
            <div className="limit-item">
              <span className="limit-label">月間上限:</span>
              <span className="limit-value">{balance.monthlyLimit} pt</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">今月の変換済み:</span>
              <span className="limit-value converted">{balance.currentMonthConverted} pt</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">残り変換可能:</span>
              <span className={`limit-value remaining ${balance.remainingLimit <= 0 ? 'zero' : ''}`}>
                {balance.remainingLimit} pt
              </span>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min((balance.currentMonthConverted / balance.monthlyLimit) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {balance.monthlyLimit > 0
              ? `${Math.round((balance.currentMonthConverted / balance.monthlyLimit) * 100)}% 使用中`
              : '0% 使用中'}
          </p>
        </div>
      )}

      <div className="transactions-section">
        <h2>ポイント履歴</h2>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>ポイント履歴がありません</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className={`transaction-card ${transaction.type}`}>
                <div className="transaction-header">
                  <span className={`transaction-type ${transaction.type}`}>
                    {getTransactionTypeLabel(transaction.type)}
                  </span>
                  <span className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'use' ? '-' : '+'}
                    {transaction.amount} pt
                  </span>
                </div>
                <div className="transaction-description">
                  {transaction.description}
                </div>
                {transaction.admin && (
                  <div className="transaction-admin">
                    管理者: {transaction.admin.name}
                  </div>
                )}
                <div className="transaction-date">{formatDate(transaction.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Points;
