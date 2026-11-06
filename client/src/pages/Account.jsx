import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, SIZES, STAGES, STATUS_LABEL } from '../api';

export default function Account() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/bookings/mine').then(setRows).catch((e) => setErr(e.message));
  }, []);

  async function cancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const b = await api(`/bookings/${id}/cancel`, { method: 'PATCH' });
      setRows((r) => r.map((x) => (x._id === id ? { ...x, status: b.status } : x)));
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <section className="view on">
      <div className="wrap">
        <h2>My bookings</h2>
        <p className="sub">Track each job from booking to pickup.</p>
        {err && <p className="err">{err}</p>}
        {!rows && !err && <p>Loading…</p>}
        {rows && rows.length === 0 && <p>No bookings yet. <Link to="/book">Book now</Link></p>}
        {rows?.map((b) => {
          const stage = STAGES.indexOf(b.status);
          return (
            <div className="card2" key={b._id}>
              <h3>{b.service?.name} · {SIZES.find((z) => z[0] === b.vehicleSize)?.[1]}</h3>
              <p className="small" style={{ margin: '2px 0' }}>
                Ref PS-{b._id.slice(-6).toUpperCase()} · {b.date} at {b.slot} · ${b.price}
                {b.deposit.requested && ` · Deposit ${b.deposit.paid ? 'paid' : 'requested'}`}
              </p>
              {b.status === 'cancelled' ? (
                <p><span className="pill">Cancelled</span></p>
              ) : (
                <ol className="trk">
                  {STAGES.map((s, i) => (
                    <li key={s} className={i < stage ? 'done' : i === stage ? 'cur' : ''}>{STATUS_LABEL[s]}</li>
                  ))}
                </ol>
              )}
              {['pending', 'approved'].includes(b.status) && (
                <button className="btn alt" style={{ marginTop: 10, padding: '4px 12px' }} onClick={() => cancel(b._id)}>Cancel booking</button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
