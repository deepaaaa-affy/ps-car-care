import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { headerOffset, scrollToId } from '../scroll';
import Services from './Services';
import About from './About';
import Gallery from './Gallery';
import Contact from './Contact';

const FINISHES = [
  ['Ivory', '#efe3c4', 'Pearl and clearcoat finish'],
  ['Racing green', '#2f5d46', 'Full respray or panel paint'],
  ['Oxblood', '#7a2e2a', 'Colour-matched touch-up'],
  ['Sky blue', '#6c9bb0', 'Deep gloss polish'],
  ['Mustard', '#d9a441', 'Custom colour paint'],
  ['Charcoal', '#3a3632', 'PPF in satin or gloss'],
];

const HIGHLIGHTS = [
  ['Car wash and detailing', 'Hand wash, interior vacuum and a full detail for that showroom feel.'],
  ['Interior and exterior cleaning', 'Deep clean of seats, carpets, glass and paintwork.'],
  ['Paint protection and waxing', 'Wax, polish and PPF to keep the finish protected.'],
  ['General car care and maintenance', 'Paint touch-ups, scratch repair and window tinting.'],
];

export default function Home() {
  const [i, setI] = useState(1);
  const [name, colour, note] = FINISHES[i];
  const { hash, key } = useLocation();

  // Arriving from another page via "/#services" etc.: scroll there once the sections exist.
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const raf = requestAnimationFrame(() => scrollToId(id));
    // The service menu loads after mount and pushes later sections down; correct the position once.
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el && Math.abs(el.getBoundingClientRect().top - headerOffset()) > 24) scrollToId(id);
    }, 600);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [hash, key]);

  return (
    <>
      <section className="view on" id="home">
        <div className="wrap">
          <Reveal className="hero">
            <div>
              <svg className="badge" viewBox="0 0 200 200" aria-hidden="true">
                <defs><path id="badgeCircle" d="M100 100m-72 0a72 72 0 1 1 144 0a72 72 0 1 1-144 0" /></defs>
                <circle cx="100" cy="100" r="96" fill="#d9a441" stroke="#2a2622" strokeWidth="4" />
                <text fontFamily="Work Sans,sans-serif" fontWeight="600" fontSize="15" letterSpacing="3.6" fill="#2a2622">
                  <textPath href="#badgeCircle">CAR CARE · YOUR WAY · ALBURY NSW · </textPath>
                </text>
                <text x="100" y="116" textAnchor="middle" fontFamily="Fraunces,serif" fontWeight="600" fontSize="44" fill="#7a2e2a">PS</text>
              </svg>
              <h1>Quality care for a smoother ride.</h1>
              <p className="lead">
                Car wash, detailing, paint protection, polish, tint and more in Albury, NSW. Pick a finish on the poster, then book your slot online.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link className="btn" to="/book">Book an appointment</Link>
                <a className="btn alt" href="/#services" onClick={(e) => { e.preventDefault(); scrollToId('services'); }}>View the menu</a>
              </div>
            </div>
  
            <div className="poster">
              <svg viewBox="0 0 600 220" role="img" aria-label={`Car painted ${name}`}>
                <circle className="sun" cx="300" cy="120" r="96" opacity=".85" />
                <path className="body" style={{ fill: colour }} stroke="#2a2622" strokeWidth="3" d="M30 160 Q30 130 70 124 L190 110 Q232 48 306 46 L398 46 Q452 52 484 104 L540 112 Q578 120 580 148 L582 168 Q582 176 572 176 L40 176 Q30 176 30 168 Z" />
                <path d="M216 104 Q244 64 306 62 L350 62 L350 104 Z M366 62 L400 62 Q438 70 456 104 L366 104 Z" fill="#f8f1de" stroke="#2a2622" strokeWidth="3" />
                <circle cx="140" cy="176" r="34" fill="#2a2622" /><circle cx="140" cy="176" r="14" fill="#d9a441" />
                <circle cx="466" cy="176" r="34" fill="#2a2622" /><circle cx="466" cy="176" r="14" fill="#d9a441" />
                <path d="M20 212 H580" stroke="#2a2622" strokeWidth="3" />
              </svg>
              <div className="chips">
                {FINISHES.map((f, n) => (
                  <button key={f[0]} style={{ '--c': f[1] }} aria-label={f[0]} aria-pressed={n === i} onClick={() => setI(n)} />
                ))}
              </div>
              <p id="fin"><b>{name}</b> · {note}</p>
            </div>
          </Reveal>

          <Reveal className="whatwedo">
            <h2>What we do</h2>
            <p className="sub">Every job is booked into a real slot, so you know when your car is ready.</p>
            <div className="cols">
              {HIGHLIGHTS.map(([t, d]) => (
                <div key={t}><h3>{t}</h3><p>{d}</p></div>
              ))}
            </div>
          </Reveal>
          <p className="tag" style={{ textAlign: 'center', margin: '44px 0 0' }}>Clean cars, happy drives.</p>
        </div>
      </section>

      {/* The other pages, stacked below as sections. Their own routes (/services etc.) still work. */}
      <div id="services" className="band alt"><Reveal><Services /></Reveal></div>
      <div id="about" className="band"><Reveal><About /></Reveal></div>
      <div id="gallery" className="band alt"><Reveal><Gallery /></Reveal></div>
      <div id="contact" className="band"><Reveal><Contact /></Reveal></div>
    </>
  );
}
