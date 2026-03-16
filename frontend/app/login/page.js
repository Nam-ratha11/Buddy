"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('sprout_current_user');
    if (user) router.replace('/');
  }, [router]);

  const handleLogin = () => {
    setError('');
    if (!name.trim() || !studentId.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    const users = JSON.parse(localStorage.getItem('sprout_users') || '[]');
    const found = users.find(
      u => u.studentId === studentId.trim() &&
           u.name.toLowerCase() === name.trim().toLowerCase() &&
           u.password === password
    );
    if (!found) {
      setError('Incorrect details. Please check your name, ID, or password.');
      setLoading(false);
      return;
    }
    localStorage.setItem('sprout_current_user', JSON.stringify(found));
    router.replace('/');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  const inputStyle = {
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius)',
    border: '1.5px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    fontSize: '1rem',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem',
      background: 'var(--background)'
    }}>
      <div className="glass card" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '3rem 2.5rem',
        maxWidth: '440px',
        width: '100%',
        gap: '1.75rem'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--primary)' }}>Sprout</span> AI
          </h1>
          <p style={{ opacity: 0.55, fontSize: '1rem' }}>Welcome back! Sign in to continue.</p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          {/* Hidden dummy inputs — trick Chrome into not targeting real fields */}
          <input type="text" style={{ display: 'none' }} autoComplete="username" readOnly />
          <input type="password" style={{ display: 'none' }} autoComplete="new-password" readOnly />

          {/* Student Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Student Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              readOnly
              style={inputStyle}
              onFocus={e => { e.target.removeAttribute('readonly'); e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Student ID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Student ID</label>
            <input
              type="text"
              placeholder="Enter your student ID"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              readOnly
              style={inputStyle}
              onFocus={e => { e.target.removeAttribute('readonly'); e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ ...inputStyle, paddingRight: '3rem' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  opacity: 0.5,
                  padding: 0,
                  lineHeight: 1
                }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <p style={{
              color: '#e53e3e',
              fontSize: '0.85rem',
              background: '#fff5f5',
              border: '1px solid #fed7d7',
              borderRadius: '0.5rem',
              padding: '0.6rem 0.9rem',
              margin: 0
            }}>
              {error}
            </p>
          )}

          <button
            className="btn-primary"
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              marginTop: '0.25rem',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.8rem', opacity: 0.5, whiteSpace: 'nowrap' }}>New to Sprout?</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Register link */}
        <Link href="/register" style={{
          width: '100%',
          display: 'block',
          textAlign: 'center',
          padding: '0.9rem',
          borderRadius: 'var(--radius)',
          border: '1.5px solid var(--primary)',
          color: 'var(--primary)',
          fontWeight: 600,
          fontSize: '0.95rem',
          textDecoration: 'none',
          transition: 'background 0.2s',
          fontFamily: 'Outfit, sans-serif'
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Create a new account
        </Link>
      </div>
    </div>
  );
}
