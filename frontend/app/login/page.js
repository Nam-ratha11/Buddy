"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)',
  red: 'var(--red)', redBg: 'var(--redBg)', redLine: 'var(--redLine)',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--page); font-family: 'DM Sans', sans-serif; }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px var(--card) inset !important;
    -webkit-text-fill-color: var(--ink) !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);



  const handleLogin = () => {
    setError('');
    if (!name.trim()) { setError('Please enter your student name.'); return; }
    if (!studentId.trim()) { setError('Please enter your student ID.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      const users = JSON.parse(localStorage.getItem('sprout_users') || '[]');
      const found = users.find(u =>
        u.studentId === studentId.trim() &&
        u.name.toLowerCase() === name.trim().toLowerCase() &&
        u.password === password
      );
      if (!found) {
        setError('Incorrect details. Please check your name, ID, or password.');
        setLoading(false);
        return;
      }
      localStorage.setItem('sprout_current_user', JSON.stringify(found));
      router.replace('/analyze');
    } catch (_) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const inputStyle = (field, extra = {}) => ({
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: `1.5px solid ${focusedField === field ? T.gMid : T.line}`,
    background: T.cardBg,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: T.ink,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? `0 0 0 3px ${T.gLight}` : 'none',
    ...extra,
  });

  const fields = [
    { id: 'name',      label: 'Student Name', placeholder: 'Enter your full name',  value: name,      set: setName,      type: 'text' },
    { id: 'studentId', label: 'Student ID',   placeholder: 'Enter your student ID', value: studentId, set: setStudentId, type: 'text' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS }} />
      <div style={{
        minHeight: '100vh', background: T.pageBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div style={{
          background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 24,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.08)',
          width: '100%', maxWidth: 420, overflow: 'hidden',
        }}>
          {/* Top accent stripe */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${T.green}, #FCD34D, transparent)` }} />

          <div style={{ padding: '36px 36px 32px' }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 48, height: 48, borderRadius: 14, background: T.green,
                boxShadow: `0 4px 14px ${T.gGlow}`, marginBottom: 14,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22C12 22 4 16 4 9a8 8 0 0 1 16 0c0 7-8 13-8 13z"/>
                  <path d="M12 22V9"/>
                </svg>
              </div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.ink, marginBottom: 4 }}>
                Sprout<span style={{ color: T.green }}>AI</span>
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.hint }}>
                Welcome back! Sign in to continue.
              </p>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name + Student ID */}
              {fields.map(({ id, label, placeholder, value, set, type }) => (
                <div key={id}>
                  <label style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600,
                    fontSize: 12, color: T.sub, display: 'block', marginBottom: 6,
                  }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    autoComplete={id === 'name' ? 'name' : 'username'}
                    onChange={e => set(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    onFocus={() => setFocusedField(id)}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle(id)}
                  />
                </div>
              ))}

              {/* Password */}
              <div>
                <label style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600,
                  fontSize: 12, color: T.sub, display: 'block', marginBottom: 6,
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    autoComplete="current-password"
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle('password', { paddingRight: 46 })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: T.hint, borderRadius: 6, transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = T.sub}
                    onMouseLeave={e => e.currentTarget.style.color = T.hint}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: T.redBg, border: `1px solid ${T.redLine}`,
                  borderRadius: 10, padding: '10px 14px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.red,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                  background: loading ? '#EFEFEB' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: loading ? '#AAAA9E' : 'white',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : `0 4px 14px ${T.gGlow}`,
                  transition: 'all 0.2s ease', marginTop: 4,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.32)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : `0 4px 14px ${T.gGlow}`; }}
              >
                {loading ? 'Signing in…' : 'Login →'}
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0' }}>
              <div style={{ flex: 1, height: 1, background: T.line }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.hint }}>New to Sprout?</span>
              <div style={{ flex: 1, height: 1, background: T.line }} />
            </div>

            {/* Register link */}
            <Link href="/register" style={{
              display: 'block', width: '100%', textAlign: 'center',
              padding: '12px', borderRadius: 12,
              border: `1.5px solid ${T.gRing}`, color: T.green,
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14,
              textDecoration: 'none', transition: 'all 0.18s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.gLight; e.currentTarget.style.borderColor = T.green; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.gRing; }}
            >
              Create a new account
            </Link>

            {/* Back to home */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/" style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.hint,
                textDecoration: 'none', transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = T.sub}
                onMouseLeave={e => e.currentTarget.style.color = T.hint}
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
