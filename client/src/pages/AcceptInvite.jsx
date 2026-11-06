import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

// Invited staff choose their password here, then log in on the normal /login page.
export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [f, setF] = useState({ password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (f.password.length < 10) return setErr('Password must be at least 10 characters');
    if (f.password !== f.confirm) return setErr('The two passwords do not match');
    setBusy(true);
    try {
      setDone(await api('/auth/accept-invite', { method: 'POST', body: { token, password: f.password } }));
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="view on">
      <div className="wrap">
        <div className="ticket" style={{ maxWidth: 420, margin: '0 auto' }}>
          <p className="small" style={{ margin: 0 }}>PS Car Care · Staff</p>
          <h2>Choose your password</h2>
          {done ? (
            <div className="done">
              <p style={{ margin: '0 0 12px' }}>Your password is set. Log in with <b>{done.email}</b> and your new password.</p>
              <Link className="btn" to="/login">Go to log in</Link>
            </div>
          ) : !token ? (
            <p className="err">This invite link is incomplete. Open the full link you were sent, or ask an admin for a new one.</p>
          ) : (
            <form onSubmit={submit}>
              <label>New password<input className="f" type="password" value={f.password} onChange={set('password')} required minLength={10} maxLength={128} autoComplete="new-password" /></label>
              <label>Type it again<input className="f" type="password" value={f.confirm} onChange={set('confirm')} required minLength={10} maxLength={128} autoComplete="new-password" /></label>
              <p className="small" style={{ marginTop: -4 }}>At least 10 characters. This link works once and expires 48 hours after it was sent.</p>
              {err && <p className="err" role="alert">{err}</p>}
              <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Set password'}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
