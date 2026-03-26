"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)',
  red: 'var(--red)', redBg: 'var(--redBg)', redLine: 'var(--redLine)',
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--page); font-family: 'DM Sans', sans-serif; }`;

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



  const handleRegister = () => {
    setError('');
    if (!name.trim() || !studentId.trim()) { setError('Please fill in your name and student ID.'); return; }
    if (!grade) { setError('Please select your grade.'); return; }
    if (!password) { setError('Please enter a password.'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const users = JSON.parse(localStorage.getItem('sprout_users') || '[]');
    if (users.find(u => u.studentId === studentId.trim())) {
      setError('A student with this ID already exists. Please log in instead.');
      setLoading(false); return;
    }
    const newUser = { name: name.trim(), studentId: studentId.trim(), grade, password };
    users.push(newUser);
    localStorage.setItem('sprout_users', JSON.stringify(users));
    localStorage.setItem('sprout_current_user', JSON.stringify(newUser));
    router.replace('/analyze');
  };

  const inp = (extra = {}) => ({
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${T.line}`, background: T.cardBg,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: T.ink,
    outline: 'none', transition: 'border-color 0.2s', ...extra,
  });

  const pwBtn = { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.5, padding: 0 };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS }} />
      <div style={{ minHeight: '100vh', background: T.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>

        <div style={{
          background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 24,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.08)',
          width: '100%', maxWidth: 440, overflow: 'hidden',
        }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${T.green}, #FCD34D, transparent)` }} />

          <div style={{ padding: '36px 36px 32px' }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: T.green, boxShadow: `0 4px 14px ${T.gGlow}`, marginBottom: 14 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M8 12s1.5-2 4-2 4 2 4 2"/><path d="M12 10v4"/></svg>
              </div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.ink, marginBottom: 4 }}>
                Sprout<span style={{ color: T.green }}>AI</span>
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.hint }}>Create your account to get started.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input type="text" style={{ display: 'none' }} autoComplete="username" readOnly />
              <input type="password" style={{ display: 'none' }} autoComplete="new-password" readOnly />

              {/* Name */}
              <div>
                <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Student Name</label>
                <input type="text" placeholder="Enter your full name" value={name}
                  onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  style={inp()} onFocus={e => e.target.style.borderColor = T.gMid} onBlur={e => e.target.style.borderColor = T.line}
                />
              </div>

              {/* Student ID */}
              <div>
                <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Student ID</label>
                <input type="text" placeholder="e.g. STU001" value={studentId}
                  onChange={e => setStudentId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  autoComplete="off" readOnly style={inp()}
                  onFocus={e => { e.target.removeAttribute('readonly'); e.target.style.borderColor = T.gMid; }}
                  onBlur={e => e.target.style.borderColor = T.line}
                />
              </div>

              {/* Grade */}
              <div>
                <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12, color: T.sub, display: 'block', marginBottom: 8 }}>Select Your Grade</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {GRADES.map(g => (
                    <button key={g} type="button" onClick={() => setGrade(g)} style={{
                      flex: '1 1 auto', padding: '8px 6px', borderRadius: 10,
                      border: `1.5px solid ${grade === g ? T.green : T.line}`,
                      background: grade === g ? T.gLight : T.cardBg,
                      color: grade === g ? T.green : T.sub,
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: grade === g ? 700 : 500,
                      fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                    }}>{g}</button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Create a password (min 4 chars)"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    style={inp({ paddingRight: 44 })}
                    onFocus={e => e.target.style.borderColor = T.gMid} onBlur={e => e.target.style.borderColor = T.line}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={pwBtn}>{showPassword ? '🙈' : '👁'}</button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    style={inp({ paddingRight: 44, borderColor: confirmPassword && confirmPassword !== password ? T.red : T.line })}
                    onFocus={e => e.target.style.borderColor = confirmPassword !== password ? T.red : T.gMid}
                    onBlur={e => e.target.style.borderColor = confirmPassword && confirmPassword !== password ? T.red : T.line}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={pwBtn}>{showConfirm ? '🙈' : '👁'}</button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.red, marginTop: 4 }}>Passwords do not match</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div style={{ background: T.redBg, border: `1px solid ${T.redLine}`, borderRadius: 10, padding: '10px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.red }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button onClick={handleRegister} disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
                boxShadow: `0 4px 14px ${T.gGlow}`, transition: 'all 0.2s ease', marginTop: 4,
              }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.32)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px ${T.gGlow}`; }}
              >
                {loading ? 'Creating account…' : 'Register & Sign In'}
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0' }}>
              <div style={{ flex: 1, height: 1, background: T.line }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.hint }}>Already registered?</span>
              <div style={{ flex: 1, height: 1, background: T.line }} />
            </div>

            <Link href="/login" style={{
              display: 'block', width: '100%', textAlign: 'center',
              padding: '12px', borderRadius: 12,
              border: `1.5px solid ${T.line}`, color: T.sub,
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14,
              textDecoration: 'none', transition: 'all 0.18s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.gRing; e.currentTarget.style.color = T.green; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.color = T.sub; }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
