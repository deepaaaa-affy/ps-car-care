import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SECTIONS, headerOffset, scrollToId } from '../scroll';
import Login from '../pages/Login';

const on = ({ isActive }) => (isActive ? 'on' : '');

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const [active, setActive] = useState('home');

  // /login and /signup show the home page behind a pop-up
  const modal = pathname === '/login' ? 'login' : pathname === '/signup' ? 'signup' : null;
  const onHome = pathname === '/';
  const homeBehind = onHome || !!modal;
  const current = homeBehind ? active : SECTIONS.find((s) => s[2] === pathname)?.[0];

  // Menu links scroll on the home page; from any other page they go to "/#section".
  const goSection = (id) => (e) => {
    e.preventDefault();
    if (onHome) return scrollToId(id);
    navigate(id === 'home' ? '/' : '/#' + id);
    if (id === 'home') window.scrollTo(0, 0);
  };
  const sectionLink = ([id, label], inNav = true) => (
    <a key={id} href={id === 'home' ? '/' : '/#' + id} onClick={goSection(id)}
      className={inNav && current === id ? 'on' : undefined} aria-current={inNav && current === id ? 'true' : undefined}>
      {label}
    </a>
  );

  // Highlight the section currently being read
  useEffect(() => {
    if (!homeBehind) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const off = headerOffset() + 12;
      let cur = 'home';
      for (const [id] of SECTIONS.slice(1)) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - off <= 0) cur = id;
      }
      // The last section may be too short to reach the top: count the page bottom as "contact"
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) cur = SECTIONS.at(-1)[0];
      setActive(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [homeBehind]);

  // On phones the menu is a scrollable row: keep the highlighted item visible
  useEffect(() => {
    const nav = navRef.current;
    const a = nav?.querySelector('a.on');
    if (!a || nav.scrollWidth <= nav.clientWidth) return;
    const n = nav.getBoundingClientRect();
    const r = a.getBoundingClientRect();
    if (r.left < n.left || r.right > n.right - 24) nav.scrollBy({ left: r.left - n.left - 12 });
  }, [current, pathname]);

  const doLogout = async () => { await logout(); navigate('/'); };
  const accountLink = user?.role === 'admin' ? ['/admin', 'Admin'] : user ? ['/account', 'My bookings'] : null;

  return (
    <>
      <div className="strip">Albury, NSW · Call 0466 471 392 · Car care, your way</div>
      <header className="nav">
        <div className="wrap">
          <Link className="logo" to="/" onClick={goSection('home')}>PS <i>Car Care</i></Link>
          <nav aria-label="Main" ref={navRef}>
            {SECTIONS.map((s) => sectionLink(s))}
            {accountLink && <NavLink to={accountLink[0]} className={on}>{accountLink[1]}</NavLink>}
          </nav>
          <div className="acts">
            {user ? (
              <button className="btn alt sm" onClick={doLogout}>Log out</button>
            ) : (
              <Link className="btn alt sm" to="/login">Log in</Link>
            )}
            <Link className="btn sm" to="/book">Book now</Link>
          </div>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="site-footer">
        <div className="wrap f-grid">
          <div className="f-brand">
            <Link className="logo" to="/" onClick={goSection('home')}>PS <i>Car Care</i></Link>
            <p>Quality car wash, detailing, paint protection and tint in Albury, NSW. Every job booked into a real slot.</p>
            <Link className="btn gold" to="/book">Book an appointment</Link>
          </div>
          <div>
            <h3 className="f-h">Explore</h3>
            <ul className="f-list">
              {SECTIONS.map((s) => <li key={s[0]}>{sectionLink(s, false)}</li>)}
              <li>{accountLink ? <Link to={accountLink[0]}>{accountLink[1]}</Link> : <Link to="/login">Log in</Link>}</li>
            </ul>
          </div>
          <div>
            <h3 className="f-h">Get in touch</h3>
            <ul className="f-list">
              <li><a href="tel:0466471392">0466 471 392</a></li>
              <li><a href="mailto:ps.carcare26@gmail.com">ps.carcare26@gmail.com</a></li>
              <li><a href="https://www.facebook.com/share/1EgiVpUxdJ/" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li>Albury, NSW</li>
            </ul>
          </div>
          <div>
            <h3 className="f-h">Opening</h3>
            <ul className="f-list">
              <li>Monday to Saturday</li>
              <li>By appointment (booked online)</li>
              <li>Closed Sundays</li>
            </ul>
          </div>
        </div>
        <div className="wrap f-bottom">
          <span>© {new Date().getFullYear()} PS Car Care · Albury, NSW</span>
          <span className="f-tag">Clean cars, happy drives.</span>
          <button type="button" className="f-top" onClick={() => scrollToId('home')}>Back to top ↑</button>
        </div>
      </footer>

      {modal && <Login mode={modal} />}
    </>
  );
}
