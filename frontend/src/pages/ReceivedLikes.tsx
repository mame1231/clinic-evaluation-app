import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Like } from '../types';
import '../styles/ReceivedLikes.css';

const ReceivedLikes: React.FC = () => {
  const [likes, setLikes] = useState<Like[]>([]);
  const [newLikesCount, setNewLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadReceivedLikes();
  }, []);

  const loadReceivedLikes = async () => {
    try {
      const response = await api.get('/likes/received');
      setLikes(response.data.likes);
      setNewLikesCount(response.data.newLikesCount);
    } catch (error) {
      console.error('Error loading received likes:', error);
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

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="received-likes-container">
      <header className="page-header">
        <h1>受信いいね一覧</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← 戻る
        </button>
      </header>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">合計いいね数:</span>
          <span className="stat-value">{likes.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">未交換:</span>
          <span className="stat-value highlight">{newLikesCount}</span>
        </div>
      </div>

      {newLikesCount > 0 && (
        <div className="convert-notice">
          {newLikesCount}個の未交換のいいねがあります。
          <button
            onClick={() => navigate('/points')}
            className="convert-link-btn"
          >
            ポイントに交換する →
          </button>
        </div>
      )}

      {likes.length === 0 ? (
        <div className="empty-state">
          <p>まだいいねを受け取っていません</p>
        </div>
      ) : (
        <div className="likes-list">
          {likes.map((like) => (
            <div
              key={like.id}
              className={`like-card ${like.isConverted ? 'converted' : 'new'}`}
            >
              <div className="like-header">
                <div className="sender-info">
                  <span className="sender-name">{like.sender?.name}</span>
                  <span className="sender-role">
                    {like.sender?.role === 'nurse' ? '看護師' : '事務'}
                  </span>
                </div>
                <div className="like-status">
                  {like.isConverted ? (
                    <span className="status-badge converted">交換済み</span>
                  ) : (
                    <span className="status-badge new">未交換</span>
                  )}
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

export default ReceivedLikes;
