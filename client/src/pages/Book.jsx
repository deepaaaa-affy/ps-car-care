import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, SIZES } from '../api';

const STEPS = ['Service', 'Vehicle', 'Date and time', 'Confirm'];
const ymd = (d) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD

function nextDays() {
  const out = [];
  for (let i = 1; out.length < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0) out.push(d); // closed Sundays
  }
  return out;
}

export default function Book() {
  const [params] = useSearchParams();
  const [services, setServices] = useState([]);
  const [svc, setSvc] = useState(params.get('service'));
  const [step, setStep] = useState(params.get('service') ? 1 : 0);
  const [size, setSize] = useState(null);
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [taken, setTaken] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const days = useMemo(nextDays, []);
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);

  useEffect(() => {
    api('/services').then(setServices).catch((e) => setErr(e.message));
  }, []);

  const loadSlots = (d) =>
    api('/bookings/slots?date=' + d)
      .then((r) => { setSlots(r.slots); setTaken(r.taken); })
      .catch((e) => setErr(e.message));

  useEffect(() => {
    if (!date) return;
    setSlot(null);
    loadSlots(date);
  }, [date]);

  const service = services.find((s) => s._id === svc);
  const mult = size ? SIZES.find((z) => z[0] === size)[2] : 1;
  const price = service ? Math.round(service.basePrice * mult) : 0;
  const canNext = [!!svc, !!size, !!slot, true][step];

  async function submit() {
    setBusy(true);
    setErr('');
    try {
      const f = new FormData();
      f.append('serviceId', svc);
      f.append('vehicleSize', size);
      f.append('date', date);
      f.append('slot', slot);
      f.append('phone', phone);
      f.append('smsReminder', sms);
      photos.forEach((p) => f.append('photos', p));
      setDone(await api('/bookings', { method: 'POST', form: f }));
    } catch (e) {
      setErr(e.message);
      if (e.status === 409) { setStep(2); setSlot(null); loadSlots(date); } // someone else took it: show fresh availability
    } finally {
      setBusy(false);
    }
  }

  const goTo = (i) => { setErr(''); setStep(i); };

  // Earlier steps stay clickable so the customer can go back and change a choice
  const nav = (
    <ol className="steps">
      {STEPS.map((n, i) => (
        <li key={n} className={done || i < step ? 'ok' : i === step ? 'on' : ''}>
          {!done && i < step ? <button type="button" onClick={() => goTo(i)} title={'Change ' + n.toLowerCase()}>{n}</button> : n}
        </li>
      ))}
    </ol>
  );

  const nice = (d) => new Date(d + 'T00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
  const picks = [
    ['Service', service?.name],
    ['Vehicle', size && SIZES.find((z) => z[0] === size)[1]],
    ['Date and time', date && slot && `${nice(date)} at ${slot}`],
  ].slice(0, step);
  const summary = picks.length > 0 && (
    <ul className="picks">
      {picks.map(([label, value], i) => (
        <li key={label}>
          <span>{label}</span><b>{value}</b>
          <button type="button" className="link" onClick={() => goTo(i)}>Change</button>
        </li>
      ))}
    </ul>
  );

  if (done) {
    return (
      <section className="view on"><div className="wrap">
        <h2>Work order</h2>
        <div className="ticket">
          {nav}
          <div className="done">
            <h3>Booking requested</h3>
            <p style={{ margin: '0 0 12px' }}>
              Ref <b>PS-{done._id.slice(-6).toUpperCase()}</b> · {service?.name} · {done.date} at {done.slot}<br />
              Status: <b>Waiting for approval</b>. Follow progress under <Link to="/account">My bookings</Link>.<br />
              Payment is made at the shop.
            </p>
            <Link className="btn" to="/account">View my bookings</Link>
          </div>
        </div>
      </div></section>
    );
  }

  return (
    <section className="view on"><div className="wrap">
      <h2>Work order</h2>
      <p className="sub">Choose a service, your vehicle and a free slot. Booked slots are blocked automatically.</p>
      <div className="ticket">
        {nav}
        {summary}

        {step === 0 && (
          <div className="opts">
            {services.map((s) => (
              <button key={s._id} className={'opt' + (svc === s._id ? ' sel' : '')} onClick={() => setSvc(s._id)}>
                <b>{s.name}</b>from ${s.basePrice} · {s.duration}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="opts">
            {SIZES.map(([k, label, m]) => (
              <button key={k} className={'opt' + (size === k ? ' sel' : '')} onClick={() => setSize(k)}>
                <b>{label}</b>Price x{m}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <>
            <div className="opts" style={{ marginBottom: 12 }}>
              {days.map((d) => (
                <button key={ymd(d)} className={'opt' + (date === ymd(d) ? ' sel' : '')} onClick={() => setDate(ymd(d))}>
                  <b>{d.toLocaleDateString('en', { weekday: 'short' })}</b>
                  {d.toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                </button>
              ))}
            </div>
            {date && (
              <div className="opts">
                {slots.map((s) => (
                  <button key={s} className={'opt' + (slot === s ? ' sel' : '')} disabled={taken.includes(s)} onClick={() => setSlot(s)}>
                    <b>{s}</b>{taken.includes(s) ? 'Booked' : 'Free'}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="g2" style={{ marginTop: 14 }}>
              <div>
                <label>Damage photos (optional, up to 3)
                  <input className="f" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setPhotos(Array.from(e.target.files).slice(0, 3))} />
                </label>
                <div className="thumbs">{previews.map((u) => <img key={u} src={u} alt="Damage photo preview" />)}</div>
              </div>
              <div>
                <label>Mobile for SMS reminders
                  <input className="f" type="tel" placeholder="04xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} /> Send me SMS reminders
                </label>
              </div>
            </div>
            <fieldset style={{ border: '1.5px solid var(--tx)', margin: '12px 0 0' }}>
              <legend>Payment</legend>
              <p style={{ margin: 0 }}>Pay at the shop when you collect your vehicle.</p>
            </fieldset>
          </>
        )}

        {err && <p className="err" role="alert">{err}</p>}
        <div className="row">
          {step > 0 && <button className="btn alt" onClick={() => goTo(step - 1)}>Back</button>}
          {step < 3 ? (
            <button className="btn" disabled={!canNext} onClick={() => goTo(step + 1)}>Next</button>
          ) : (
            <button className="btn" disabled={busy} onClick={submit}>{busy ? 'Booking…' : 'Confirm booking'}</button>
          )}
          <div className="quote">Estimate <b>${price}</b></div>
        </div>
      </div>
    </div></section>
  );
}
