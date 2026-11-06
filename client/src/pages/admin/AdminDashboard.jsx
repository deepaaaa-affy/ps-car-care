import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, SIZES, STATUS_LABEL } from '../../api';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Bookings', 'Services', 'Staff'];

export default function AdminDashboard() {
  const { user: admin, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Bookings');

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <b style={{ font: "600 20px Fraunces, serif" }}>PS <i style={{ color: 'var(--red)' }}>Car Care</i> · Admin</b>
        <span className="small">{admin.name} · {admin.email}</span>
        <Link className="small" to="/" style={{ marginLeft: 'auto' }}>View website</Link>
        <button className="btn alt" style={{ padding: '4px 12px' }} onClick={async () => { await logout(); navigate('/login'); }}>
          Log out
        </button>
      </div>
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Bookings' && <Bookings />}
      {tab === 'Services' && <Services />}
      {tab === 'Staff' && <Staff />}
    </div>
  );
}

function Bookings() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/admin/bookings').then(setRows).catch((e) => setErr(e.message));
  }, []);

  async function setStatus(id, status) {
    try {
      const b = await api('/admin/bookings/' + id, { method: 'PATCH', body: { status } });
      setRows((r) => r.map((x) => (x._id === id ? { ...x, status: b.status } : x)));
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="card2">
      <h3>Bookings</h3>
      {err && <p className="err">{err}</p>}
      {!rows && !err && <p>Loading…</p>}
      {rows && rows.length === 0 && <p>No bookings yet.</p>}
      {rows && rows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="t">
            <thead>
              <tr><th>When</th><th>Customer</th><th>Service</th><th>Vehicle</th><th>Price</th><th>Extras</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b._id}>
                  <td>{b.date} {b.slot}</td>
                  <td>{b.user?.name}<br /><span className="small">{b.user?.email}{b.phone ? ` · ${b.phone}` : ''}</span></td>
                  <td>{b.service?.name}</td>
                  <td>{SIZES.find((z) => z[0] === b.vehicleSize)?.[1]}</td>
                  <td>${b.price}</td>
                  <td>
                    {b.deposit.requested && <span className="pill">Deposit ${b.deposit.amount}</span>}{' '}
                    {b.photos.map((f, i) => (
                      <a key={f} href={`/api/admin/photos/${f}`} target="_blank" rel="noopener noreferrer">Photo {i + 1} </a>
                    ))}
                  </td>
                  <td>
                    <select className="f" style={{ margin: 0, padding: 3 }} value={b.status} onChange={(e) => setStatus(b._id, e.target.value)}>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Services() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [nu, setNu] = useState({ name: '', basePrice: '', duration: '' });

  useEffect(() => {
    api('/admin/services').then(setRows).catch((e) => setErr(e.message));
  }, []);

  async function save(id, patch) {
    setErr('');
    try {
      const s = await api('/admin/services/' + id, { method: 'PATCH', body: patch });
      setRows((r) => r.map((x) => (x._id === id ? s : x)));
    } catch (e) {
      setErr(e.message);
    }
  }

  async function add(e) {
    e.preventDefault();
    setErr('');
    try {
      const s = await api('/admin/services', { method: 'POST', body: nu });
      setRows((r) => [...r, s]);
      setNu({ name: '', basePrice: '', duration: '' });
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="card2">
      <h3>Services and prices</h3>
      {err && <p className="err">{err}</p>}
      {!rows && !err && <p>Loading…</p>}
      {rows?.map((s) => (
        <div className="svc-row" key={s._id}>
          <span style={{ flex: 1, minWidth: 160 }}>{s.name}</span>
          <label className="inline">from $
            <input className="f" type="number" min="0" defaultValue={s.basePrice} style={{ width: 90 }}
              onBlur={(e) => Number(e.target.value) !== s.basePrice && save(s._id, { basePrice: e.target.value })} />
          </label>
          <label className="inline">
            <input type="checkbox" checked={s.active} onChange={(e) => save(s._id, { active: e.target.checked })} /> Shown on site
          </label>
        </div>
      ))}
      <form onSubmit={add} className="svc-row" style={{ marginTop: 14 }}>
        <input className="f" placeholder="New service name" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
        <input className="f" type="number" min="0" placeholder="Price" value={nu.basePrice} onChange={(e) => setNu({ ...nu, basePrice: e.target.value })} required style={{ width: 90 }} />
        <input className="f" placeholder="e.g. 2 hrs" value={nu.duration} onChange={(e) => setNu({ ...nu, duration: e.target.value })} style={{ width: 100 }} />
        <button className="btn">Add</button>
      </form>
    </div>
  );
}

function Staff() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState(null); // { text, link? }
  const [f, setF] = useState({ name: '', email: '' });

  const load = () => api('/admin/staff').then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  // After an invite: either it was emailed, or we show the link for the admin to send themselves.
  const inviteMsg = (d, email) =>
    d.emailed
      ? { text: `Invite emailed to ${email}. The link works once and expires in 48 hours.` }
      : { text: `Email is not set up, so send this link to ${email} yourself. It works once and expires in 48 hours.`, link: d.inviteUrl };

  async function invite(e) {
    e.preventDefault();
    setErr('');
    setMsg(null);
    try {
      const d = await api('/admin/staff/invite', { method: 'POST', body: f });
      setMsg(inviteMsg(d, f.email));
      setF({ name: '', email: '' });
      load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function reinvite(s) {
    if (!window.confirm(`Send ${s.name} a new invite? Their current password stops working and they are logged out.`)) return;
    setErr('');
    setMsg(null);
    try {
      setMsg(inviteMsg(await api(`/admin/staff/${s.id}/reinvite`, { method: 'POST' }), s.email));
      load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function setActive(s, active) {
    setErr('');
    setMsg(null);
    try {
      await api('/admin/staff/' + s.id, { method: 'PATCH', body: { active } });
      load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="card2">
      <h3>Staff with admin access</h3>
      <p className="small">
        Any admin can add another staff member. They get a link to choose a password, then log in on the normal login page.
        Use "Send new invite" if someone never set their password or has forgotten it.
      </p>
      {err && <p className="err" role="alert">{err}</p>}
      {msg && (
        <div className="okbox" role="status">
          <p style={{ margin: 0 }}>{msg.text}</p>
          {msg.link && (
            <div className="svc-row" style={{ marginTop: 8 }}>
              <input className="f" readOnly value={msg.link} onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 200 }} aria-label="Invite link" />
              <button className="btn alt" type="button" onClick={() => navigator.clipboard?.writeText(msg.link)}>Copy</button>
            </div>
          )}
        </div>
      )}
      {!rows && !err && <p>Loading…</p>}
      {rows && (
        <div style={{ overflowX: 'auto' }}>
          <table className="t">
            <thead><tr><th>Name</th><th>Email</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}{s.isMe && ' (you)'}</td>
                  <td>{s.email}</td>
                  <td>
                    <span className="pill">
                      {!s.active ? 'Deactivated' : s.hasPassword ? 'Active' : s.inviteExpired ? 'Invite expired' : 'Invited · password not set'}
                    </span>
                  </td>
                  <td>
                    {!s.isMe && (
                      <>
                        {s.active && <button className="btn alt link" onClick={() => reinvite(s)}>Send new invite</button>}{' '}
                        <button className="btn alt link" onClick={() => setActive(s, !s.active)}>{s.active ? 'Deactivate' : 'Reactivate'}</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={invite} className="svc-row" style={{ marginTop: 14 }}>
        <input className="f" placeholder="Staff name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
        <input className="f" type="email" placeholder="Their email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required style={{ flex: 1, minWidth: 180 }} />
        <button className="btn">Invite as admin</button>
      </form>
    </div>
  );
}
