import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>ポイント制人事評価システム</h1>
        <div className="user-info">
          <span>{user.name} ({user.role === 'admin' ? '管理者' : user.role === 'nurse' ? '看護師' : '事務'})</span>
          <button onClick={handleLogout} className="logout-btn">ログアウト</button>
        </div>
      </header>

      <main className="dashboard-main">
        {user.role !== 'admin' && (
          <div className="points-card">
            <h2>現在のポイント</h2>
            <div className="points-value">{user.points} pt</div>
          </div>
        )}

        <div className="menu-grid">
          {user.role !== 'admin' && (
            <>
              <div className="menu-card" onClick={() => navigate('/send-like')}>
                <div className="menu-icon">💙</div>
                <h3>いいねを送る</h3>
                <p>同僚に感謝の気持ちを送ろう</p>
              </div>

              <div className="menu-card" onClick={() => navigate('/received-likes')}>
                <div className="menu-icon">📬</div>
                <h3>受信いいね</h3>
                <p>もらったいいねを確認</p>
              </div>

              <div className="menu-card" onClick={() => navigate('/sent-likes')}>
                <div className="menu-icon">📤</div>
                <h3>送信履歴</h3>
                <p>送ったいいねの履歴</p>
              </div>

              <div className="menu-card" onClick={() => navigate('/points')}>
                <div className="menu-icon">⭐</div>
                <h3>ポイント管理</h3>
                <p>ポイント交換と履歴</p>
              </div>

              <div className="menu-card" onClick={() => navigate('/raffle')}>
                <div className="menu-icon">🎁</div>
                <h3>懸賞応募</h3>
                <p>ポイントを使って景品に応募</p>
              </div>
            </>
          )}

          {user.role === 'admin' && (
            <div className="menu-card admin" onClick={() => navigate('/admin')}>
              <div className="menu-icon">⚙️</div>
              <h3>管理者ページ</h3>
              <p>ユーザー管理とポイントチャージ</p>
            </div>
          )}
        </div>

        <div className="info-card">
          <h2>ようこそ、{user.name}さん</h2>
          <p>ポイント制人事評価システムへようこそ。</p>
          {user.role === 'admin' && (
            <p>管理者として、ポイントの管理やユーザー管理が可能です。</p>
          )}
          {user.role === 'nurse' && (
            <p>看護師として、いいねの送受信ができます。1日最大5回まで送信可能です。</p>
          )}
          {user.role === 'office' && (
            <p>事務として、いいねの送受信ができます。1日最大5回まで送信可能です。</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;