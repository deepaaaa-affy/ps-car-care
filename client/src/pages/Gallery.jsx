import { useState } from 'react';

// Placeholder visuals. Next step: let admins upload real before/after pairs.
export default function Gallery() {
  const [pos, setPos] = useState(50);
  return (
    <section className="view on">
      <div className="wrap">
        <h2>Before and after</h2>
        <p className="sub">Drag to compare. Real jobs will appear here.</p>
        <div className="ba" style={{ '--p': pos + '%' }}>
          <div className="a">Before: swirl marks</div>
          <div className="d">After: mirror gloss</div>
          <span className="h" />
          <input type="range" min="0" max="100" value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare before and after" />
        </div>
      </div>
    </section>
  );
}
