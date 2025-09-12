import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Gửi cookie cho xác thực
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Role từ API:', data.role);
        const role = data.role?.toString().trim();
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/employee');
        }
      } else {
        setError(data.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      console.error('Lỗi:', err);
      setError('Có lỗi xảy ra khi đăng nhập.');
    }
  };

  return (
    <div className="container">
      <div className="left">
        <img src="/Logo-SpeedPos.webp" alt="Logo" className="logo" />
        <div className="icons">
          <span>⭐</span>
          <span>📍</span>
          <span>🚚</span>
          <span>📦</span>
          <span>👥</span>
          <span>🌐</span>
        </div>
        <div className="clouds"></div>
      </div>
      <div className="right">
        <img src="/Logo-SpeedPos.webp" alt="Logo nhỏ" className="logo-small" />
        <h1>Đăng nhập</h1>
        <p className="welcome">Chào mừng trở lại. Đăng nhập để bắt đầu làm việc.</p>
        <hr />
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Vui lòng nhập</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email của bạn"
            required
          />
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu của bạn"
            required
          />
          <div className="options">
            <div>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember">Luôn đăng nhập</label>
            </div>
            <div className="links">
              <a href="#">Quên mật khẩu?</a>
              <br />
              <a href="#">Đăng ký</a>
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit">Đăng nhập</button>
          <div className="social-login">
            <button className="google">
              <img src="/Google__G__logo.svg.png" alt="" /> Đăng nhập bằng Google
            </button>
            <button className="microsoft">
              <img src="/Microsoft_logo.svg.png" alt="" /> Đăng nhập bằng Microsoft
            </button>
            <button className="apple">
              <img src="/Apple_logo_black.svg" alt="" /> Đăng nhập bằng Apple
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;