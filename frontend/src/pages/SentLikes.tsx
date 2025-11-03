import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Like } from '../types';
import '../styles/SentLikes.css';

const SentLikes: React.FC = () => {
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSentLikes();
  }, []);

  const loadSentLikes = async () => {
    try {
      const response = await api.get('/likes/sent');
      setLikes(response.data.likes);
    } catch (error) {
      console.error('Error loading sent likes:', error);
    } finally {
      setLoading(false);
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

  const getTodayLikesCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return likes.filter((like) => {
      const likeDate = new Date(like.createdAt);
      likeDate.setHours(0, 0, 0, 0);
      return likeDate.getTime() === today.getTime();
    }).length;
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  const todayCount = getTodayLikesCount();

  return (
    <div className="sent-likes-container">
      <header className="page-header">
        <h1>送信いいね履歴</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← 戻る
        </button>
      </header>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">合計送信数:</span>
          <span className="stat-value">{likes.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">本日の送信数:</span>
          <span className="stat-value highlight">{todayCount} / 5</span>
        </div>
      </div>

      {likes.length === 0 ? (
        <div className="empty-state">
          <p>まだいいねを送っていません</p>
          <button
            onClick={() => navigate('/send-like')}
            className="send-btn-large"
          >
            いいねを送る
          </button>
        </div>
      ) : (
        <div className="likes-list">
          {likes.map((like) => (
            <div key={like.id} className="like-card">
              <div className="like-header">
                <div className="receiver-info">
                  <span className="receiver-label">送信先:</span>
                  <span className="receiver-name">{like.receiver?.name}</span>
                  <span className="receiver-role">
                    {like.receiver?.role === 'nurse' ? '看護師' : '事務'}
                  </span>
                </div>
              </div>
              <div className="like-comment">{like.comment}</div>
              <div className="like-date">{formatDate(like.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentLikes;
