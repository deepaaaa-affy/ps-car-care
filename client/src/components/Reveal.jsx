import { useEffect, useRef, useState } from 'react';

const canAnimate = () =>
  typeof window !== 'undefined' &&
  'IntersectionObserver' in window &&
  !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Fades and slides its content up the first time it scrolls into view.
// Without IntersectionObserver, or with reduced motion, the content is simply shown.
export default function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => !canAnimate());

  useEffect(() => {
    if (shown) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [shown]);

  return <div ref={ref} className={`reveal${shown ? ' in' : ''}${className ? ' ' + className : ''}`}>{children}</div>;
}
