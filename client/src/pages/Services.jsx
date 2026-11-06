import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, SIZES } from '../api';

export default function Services() {
  const [services, setServices] = useState(null);
  const [err, setErr] = useState('');
  const [qs, setQs] = useState('');
  const [qz, setQz] = useState(0);

  useEffect(() => {
    api('/services')
      .then((list) => {
        setServices(list);
        if (list[0]) setQs(list[0]._id);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const picked = services?.find((s) => s._id === qs);
  const estimate = picked ? Math.round(picked.basePrice * SIZES[qz][2]) : 0;

  return (
    <section className="view on">
      <div className="wrap">
        <h2>The service menu</h2>
        <p className="sub">Starting prices for a small car. Final prices are confirmed after we see the vehicle.</p>
        {err && <p className="err">{err}</p>}
        {!services && !err && <p>Loading…</p>}
        {services && (
          <ul className="menu">
            {services.map((s) => (
              <li key={s._id}>
                <b>{s.name}</b>
                <span className="dots" />
                <span className="pr">from ${s.basePrice}</span>
                <p>
                  {s.description} · {s.duration}{' '}
                  <Link className="btn" to={`/book?service=${s._id}`}>Book this</Link>
                </p>
              </li>
            ))}
          </ul>
        )}

        {services && services.length > 0 && (
          <div className="est">
            <h3>Instant quote estimator</h3>
            <div className="g2" style={{ marginTop: 10 }}>
              <label>Service
                <select className="f" value={qs} onChange={(e) => setQs(e.target.value)}>
                  {services.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </label>
              <label>Vehicle size
                <select className="f" value={qz} onChange={(e) => setQz(Number(e.target.value))}>
                  {SIZES.map((z, i) => <option key={z[0]} value={i}>{z[1]}</option>)}
                </select>
              </label>
            </div>
            <p style={{ margin: '6px 0 0' }}>Estimated price <b className="tag" style={{ fontSize: 28 }}>${estimate}</b></p>
          </div>
        )}
      </div>
    </section>
  );
}
