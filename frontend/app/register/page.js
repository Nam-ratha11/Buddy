"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const GRADES = ['6th CBSE', '7th CBSE', '8th CBSE', '9th CBSE', '10th CBSE'];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [grade, setGrade] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('sprout_current_user');
    if (user) router.replace('/');
  }, [router]);

  const handleRegister = () => {
    setError('');
    if (!name.trim() || !studentId.trim()) {
      setError('Please fill in your name and student ID.');
      return;
    }
    if (!grade) {
      setError('Please select your grade.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const users = JSON.parse(localStorage.getItem('sprout_users') || '[]');
    if (users.find(u => u.studentId === studentId.trim())) {
      setError('A student with this ID already exists. Please log in instead.');
      setLoading(false);
      return;
    }
    const newUser = { name: name.trim(), studentId: studentId.trim(), grade, password };
    users.push(newUser);
    localStorage.setItem('sprout_users', JSON.stringify(users));
    localStorage.setItem('sprout_current_user', JSON.stringify(newUser));
    router.replace('/');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRegister();
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
      padding: '1.5rem 1rem',
      background: 'var(--background)'
    }}>
      <div className="glass card" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '3rem 2.5rem',
        maxWidth: '460px',
        width: '100%',
        gap: '1.5rem'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--primary)' }}>Sprout</span> AI
          </h1>
          <p style={{ opacity: 0.55, fontSize: '1rem' }}>Create your account to get started.</p>
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
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Student ID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Student ID</label>
            <input
              type="text"
              placeholder="e.g. 1, 2, STU001..."
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

          {/* Grade Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Select Your Grade</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {GRADES.map(cls => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setGrade(cls)}
                  style={{
                    flex: '1 1 auto',
                    padding: '0.65rem 0.5rem',
                    borderRadius: 'var(--radius)',
                    border: grade === cls ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: grade === cls ? 'var(--primary-light)' : 'var(--card)',
                    color: grade === cls ? 'var(--primary)' : 'var(--foreground)',
                    fontWeight: grade === cls ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'Outfit, sans-serif',
                    textAlign: 'center'
                  }}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password (min 4 chars)"
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

          {/* Confirm Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  ...inputStyle,
                  paddingRight: '3rem',
                  borderColor: confirmPassword && confirmPassword !== password ? '#e53e3e' : 'var(--border)'
                }}
                onFocus={e => e.target.style.borderColor = confirmPassword !== password ? '#e53e3e' : 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = confirmPassword && confirmPassword !== password ? '#e53e3e' : 'var(--border)'}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
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
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p style={{ fontSize: '0.78rem', color: '#e53e3e', margin: 0 }}>Passwords do not match</p>
            )}
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
            onClick={handleRegister}
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
            {loading ? 'Creating account...' : 'Register & Sign In'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.8rem', opacity: 0.5, whiteSpace: 'nowrap' }}>Already registered?</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Back to login */}
        <Link href="/login" style={{
          width: '100%',
          display: 'block',
          textAlign: 'center',
          padding: '0.9rem',
          borderRadius: 'var(--radius)',
          border: '1.5px solid var(--border)',
          color: 'var(--foreground)',
          fontWeight: 600,
          fontSize: '0.95rem',
          textDecoration: 'none',
          transition: 'border-color 0.2s, color 0.2s',
          fontFamily: 'Outfit, sans-serif',
          opacity: 0.8
        }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--foreground)';
            e.currentTarget.style.opacity = '0.8';
          }}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
