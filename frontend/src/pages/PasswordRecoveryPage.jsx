import React, { useEffect, useState } from 'react';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { request } from '../auth/AuthContext.jsx';

export default function PasswordRecoveryPage({ mode, navigate, theme = 'light', toggleTheme = () => {} }) {
  const resetting = mode === 'reset';
  const token = new URLSearchParams(location.search).get('token') || '';
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  useEffect(() => { document.title = resetting ? 'Choose a new password · CollabBoard' : 'Forgot password · CollabBoard'; }, [resetting]);
  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    if (!resetting && !/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (resetting && !token) { setError('This reset link is missing its token. Request a new password reset.'); return; }
    if (resetting && password.length < 10) { setError('Use a password with at least 10 characters.'); return; }
    if (resetting && password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const result = resetting
        ? await request('/api/auth/password/reset', { method: 'POST', body: JSON.stringify({ token, password, confirmPassword: confirm }) })
        : await request('/api/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      setMessage(result?.message || (resetting ? 'Your password has been reset. Please sign in.' : 'If an account exists and email delivery succeeds, you should receive a reset link shortly.'));
    } catch (err) { setError(err.message || 'Unable to complete the request. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-screen"><ThemeToggle className="auth-theme-toggle" theme={theme} onToggle={toggleTheme}/><a className="brand auth-brand" href="/"><span className="brand-icon">✳</span> collab<span>board</span></a><section className="auth-card recovery-card"><div className="auth-mark">✳</div><h1>{resetting ? 'Choose a new password' : 'Forgot your password?'}</h1><p>{resetting ? 'Set a new password to get back to your boards.' : 'Enter your account email. A reset link can be sent when email delivery is configured.'}</p>{message ? <div className="recovery-success" role="status"><p>{message}</p>{resetting&&<button className="button primary auth-submit" onClick={()=>navigate('/login')}>Go to sign in</button>}</div> : <form onSubmit={submit} noValidate>{resetting ? <><label>New password<input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} minLength="10" required/></label><label>Confirm new password<input type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label></> : <label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength="254" required/></label>}{error&&<div className="auth-error" role="alert">{error}</div>}<button className="button primary auth-submit" disabled={busy}>{busy?'Please wait…':resetting?'Reset password':'Send reset link'}</button></form>}<div className="auth-switch"><button onClick={()=>navigate('/login')}>Back to sign in</button></div></section><div className="auth-foot">A shared canvas for the ideas taking shape.</div></main>;
}
