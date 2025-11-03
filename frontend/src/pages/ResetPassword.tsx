import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/ResetPassword.css';

const ResetPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.newPassword || !formData.confirmPassword) {
      setError('全ての項目を入力してください');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('新しいパスワードは6文字以上で設定してください');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email: formData.email,
        newPassword: formData.newPassword,
      });

      setSuccess('パスワードをリセットしました。新しいパスワードでログインしてください。');
      setFormData({
        email: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'パスワードリセットに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h1>パスワードリセット</h1>
        <p className="subtitle">メールアドレスを入力して新しいパスワードを設定してください</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@clinic.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">新しいパスワード（6文字以上）</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">新しいパスワード（確認）</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" className="reset-password-btn" disabled={loading}>
            {loading ? 'リセット中...' : 'パスワードをリセット'}
          </button>
        </form>

        <div className="login-link">
          パスワードを思い出しましたか？
          <button onClick={() => navigate('/login')} className="link-btn">
            ログインはこちら
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
