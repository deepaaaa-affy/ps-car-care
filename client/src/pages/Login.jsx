import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Log in (customers and staff) / sign up (customers only).
// Shown as a pop-up over the home page: PublicLayout renders it on /login and /signup.
export default function Login({ mode = 'login' }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const cardRef = useRef(null);
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Back one step, or home if the pop-up was opened directly
  const close = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/', { replace: true }));
  const closeRef = useRef(close);
  closeRef.current = close;

  // Lock page scroll, close on Escape, and give focus back when the pop-up goes away
  useEffect(() => {
    const prevFocus = document.activeElement;
    const { overflow, paddingRight } = document.body.style;
    const bar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (bar > 0) document.body.style.paddingRight = bar + 'px';
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      document.removeEventListener('keydown', onKey);
      if (prevFocus?.isConnected) prevFocus.focus?.({ preventScroll: true });
    };
  }, []);

  // Focus the first field when opening or switching between log in and sign up
  useEffect(() => {
    cardRef.current?.querySelector('input')?.focus();
    setErr('');
  }, [isSignup]);

  // Keep Tab inside the pop-up
  function trapTab(e) {
    if (e.key !== 'Tab') return;
    const items = [...cardRef.current.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled)')];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const u = isSignup ? await signup(f.name, f.email, f.password) : await login(f.email, f.password);
      navigate(u.role === 'admin' ? '/admin' : loc.state?.from || '/account', { replace: true });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="ticket modal-card" ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="login-title" onKeyDown={trapTab}>
        <button type="button" className="modal-x" aria-label="Close" onClick={close}>×</button>
        <h2 id="login-title">{isSignup ? 'Create your account' : 'Log in'}</h2>
        <form onSubmit={submit}>
          {isSignup && (
            <label>Full name<input className="f" value={f.name} onChange={set('name')} required autoComplete="name" /></label>
          )}
          <label>Email<input className="f" type="email" value={f.email} onChange={set('email')} required autoComplete="email" /></label>
          <label>Password<input className="f" type="password" value={f.password} onChange={set('password')} required minLength={isSignup ? 8 : 1} autoComplete={isSignup ? 'new-password' : 'current-password'} /></label>
          {isSignup && <p className="small" style={{ marginTop: -4 }}>At least 8 characters.</p>}
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}</button>
        </form>
        <p className="small" style={{ marginBottom: 0 }}>
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <Link to={isSignup ? '/login' : '/signup'} state={loc.state} replace>{isSignup ? 'Log in' : 'Create an account'}</Link>
        </p>
      </div>
    </div>
  );
}
