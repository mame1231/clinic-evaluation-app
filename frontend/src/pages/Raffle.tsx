import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { raffleService, DrawRaffleResponse } from '../services/raffleService';
import { RaffleHistory, User } from '../types';
import '../styles/Raffle.css';

const PRIZE_POINTS = {
  A: 2000,
  B: 1000,
  C: 500,
};

const PRIZE_NAMES = {
  A: 'A賞（プレミアム景品）',
  B: 'B賞（スタンダード景品）',
  C: 'C賞（ライト景品）',
};

const Raffle: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<RaffleHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<DrawRaffleResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      const historyData = await raffleService.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDraw = async (prizeType: 'A' | 'B' | 'C') => {
    if (!user) return;

    const requiredPoints = PRIZE_POINTS[prizeType];
    if (user.points < requiredPoints) {
      alert(`ポイントが不足しています。${requiredPoints}ポイント必要です。`);
      return;
    }

    if (!window.confirm(`${PRIZE_NAMES[prizeType]}に${requiredPoints}ポイントで応募しますか？`)) {
      return;
    }

    setDrawing(true);

    try {
      const resultData = await raffleService.drawRaffle({ prizeType });
      setResult(resultData);
      setShowResult(true);

      // Update user points
      const updatedUser = { ...user, points: resultData.newBalance };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Reload history
      const historyData = await raffleService.getHistory();
      setHistory(historyData);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || '抽選に失敗しました';
      alert(errorMsg);
    } finally {
      setDrawing(false);
    }
  };

  const closeResult = () => {
    setShowResult(false);
    setResult(null);
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

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="raffle-container">
      <header className="page-header">
        <h1>🎁 懸賞応募</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← 戻る
        </button>
      </header>

      <div className="raffle-info">
        <div className="user-status">
          <div className="status-item">
            <span className="label">現在のポイント:</span>
            <span className="value points">{user.points} pt</span>
          </div>
        </div>
      </div>

      <div className="prizes-section">
        <h2>景品一覧</h2>
        <div className="prizes-grid">
          <div className="prize-card prize-a">
            <div className="prize-icon">🏆</div>
            <h3>{PRIZE_NAMES.A}</h3>
            <div className="prize-cost">{PRIZE_POINTS.A} pt</div>
            <button
              onClick={() => handleDraw('A')}
              disabled={drawing || user.points < PRIZE_POINTS.A}
              className="draw-btn"
            >
              {drawing ? '抽選中...' : '応募する'}
            </button>
            {user.points < PRIZE_POINTS.A && (
              <p className="insufficient-text">ポイント不足</p>
            )}
          </div>

          <div className="prize-card prize-b">
            <div className="prize-icon">🎖️</div>
            <h3>{PRIZE_NAMES.B}</h3>
            <div className="prize-cost">{PRIZE_POINTS.B} pt</div>
            <button
              onClick={() => handleDraw('B')}
              disabled={drawing || user.points < PRIZE_POINTS.B}
              className="draw-btn"
            >
              {drawing ? '抽選中...' : '応募する'}
            </button>
            {user.points < PRIZE_POINTS.B && (
              <p className="insufficient-text">ポイント不足</p>
            )}
          </div>

          <div className="prize-card prize-c">
            <div className="prize-icon">🎁</div>
            <h3>{PRIZE_NAMES.C}</h3>
            <div className="prize-cost">{PRIZE_POINTS.C} pt</div>
            <button
              onClick={() => handleDraw('C')}
              disabled={drawing || user.points < PRIZE_POINTS.C}
              className="draw-btn"
            >
              {drawing ? '抽選中...' : '応募する'}
            </button>
            {user.points < PRIZE_POINTS.C && (
              <p className="insufficient-text">ポイント不足</p>
            )}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && result && (
        <div className="modal-overlay" onClick={closeResult}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className={`result-display ${result.won ? 'win' : 'lose'}`}>
              {result.won ? (
                <>
                  <div className="result-icon">🎉</div>
                  <h2>おめでとうございます！</h2>
                  <p className="result-message">当選しました！</p>
                </>
              ) : (
                <>
                  <div className="result-icon">😢</div>
                  <h2>残念...</h2>
                  <p className="result-message">今回は外れでした</p>
                </>
              )}
              <div className="result-details">
                <p>景品: {PRIZE_NAMES[result.prizeType]}</p>
                <p>使用ポイント: {result.pointsUsed} pt</p>
                <p>残りポイント: {result.newBalance} pt</p>
              </div>
              <button onClick={closeResult} className="close-btn">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="history-section">
        <h2>抽選履歴</h2>
        {history.length === 0 ? (
          <div className="empty-state">
            <p>まだ抽選履歴がありません</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className={`history-card ${item.won ? 'won' : 'lost'}`}>
                <div className="history-header">
                  <span className="history-prize">{PRIZE_NAMES[item.prizeType]}</span>
                  <span className={`history-result ${item.won ? 'win' : 'lose'}`}>
                    {item.won ? '✅ 当選' : '❌ 外れ'}
                  </span>
                </div>
                <div className="history-details">
                  <span>使用: {item.pointsUsed}pt</span>
                </div>
                <div className="history-date">{formatDate(item.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Raffle;
