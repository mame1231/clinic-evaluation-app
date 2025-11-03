import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { AvailableReceiver } from '../types';
import '../styles/SendLike.css';

const SendLike: React.FC = () => {
  const [receivers, setReceivers] = useState<AvailableReceiver[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [remainingToday, setRemainingToday] = useState(5);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [canSendNow, setCanSendNow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadReceivers();
  }, []);

  const loadReceivers = async () => {
    try {
      const response = await api.get('/likes/receivers');
      setReceivers(response.data.users);
      setRemainingToday(response.data.remainingToday);
      setRemainingMinutes(response.data.remainingMinutes || 0);
      setCanSendNow(response.data.canSendNow !== false);
    } catch (error) {
      console.error('Error loading receivers:', error);
      setMessage({ type: 'error', text: 'ユーザー一覧の読み込みに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const fireConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 35,
      spread: 360,
      ticks: 80,
      zIndex: 0,
      scalar: 1.5  // Make confetti 1.5x bigger
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 60 * (timeLeft / duration);

      // Left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      // Right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleSendLike = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReceiver) {
      setMessage({ type: 'error', text: '送信先を選択してください' });
      return;
    }

    if (!comment.trim()) {
      setMessage({ type: 'error', text: 'コメントを入力してください' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      await api.post('/likes/send', {
        receiverId: selectedReceiver,
        comment: comment.trim(),
      });

      // Fire confetti!
      fireConfetti();

      setMessage({ type: 'success', text: 'いいねを送信しました！' });
      setSelectedReceiver(null);
      setComment('');

      // Reload receivers to update the list
      await loadReceivers();

      // Navigate back to dashboard after 3 seconds (to see confetti)
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || '送信に失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="send-like-container">
      <header className="page-header">
        <h1>いいねを送る</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← 戻る
        </button>
      </header>

      <div className="remaining-info">
        本日の残り送信回数: <strong>{remainingToday}</strong> / 5
      </div>

      {!canSendNow && remainingMinutes > 0 && (
        <div className="cooldown-warning">
          ⏱️ 次のいいねまであと <strong>{remainingMinutes}</strong> 分待つ必要があります
        </div>
      )}

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSendLike} className="send-like-form">
        <div className="form-group">
          <label>送信先を選択</label>
          <div className="receivers-grid">
            {receivers.map((receiver) => (
              <div
                key={receiver.id}
                className={`receiver-card ${
                  selectedReceiver === receiver.id ? 'selected' : ''
                } ${!receiver.canSend ? 'disabled' : ''}`}
                onClick={() => receiver.canSend && setSelectedReceiver(receiver.id)}
              >
                <div className="receiver-name">{receiver.name}</div>
                <div className="receiver-role">
                  {receiver.role === 'nurse' ? '看護師' : '事務'}
                </div>
                {!receiver.canSend && (
                  <div className="already-sent">本日送信済み</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comment">コメント（メッセージ）</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="感謝の気持ちや励ましのメッセージを書きましょう"
            rows={4}
            maxLength={500}
            disabled={sending}
          />
          <div className="char-count">{comment.length} / 500</div>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={sending || !selectedReceiver || !comment.trim() || remainingToday === 0 || !canSendNow}
        >
          {sending ? '送信中...' : 'いいねを送る'}
        </button>
      </form>
    </div>
  );
};

export default SendLike;
