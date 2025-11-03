import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/ChangePassword.css';

const ChangePassword: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
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
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
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

    if (formData.currentPassword === formData.newPassword) {
      setError('現在のパスワードと同じパスワードは設定できません');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccess('パスワードを変更しました');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'パスワード変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <h1>パスワード変更</h1>
        <p className="subtitle">現在のパスワードを入力して新しいパスワードを設定してください</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">現在のパスワード</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="••••••"
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

          <button type="submit" className="change-password-btn" disabled={loading}>
            {loading ? '変更中...' : 'パスワードを変更'}
          </button>
        </form>

        <div className="back-link">
          <button onClick={() => navigate('/dashboard')} className="link-btn">
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
