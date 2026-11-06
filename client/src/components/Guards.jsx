import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Loading = () => <p className="wrap" style={{ padding: 40 }}>Loading…</p>;

// These only decide what the screen shows. The server checks every request itself.
// Customer pages (booking, My bookings). Admins are sent to their panel.
export function RequireUser({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
  return user.role === 'admin' ? <Navigate to="/admin" replace /> : children;
}

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return user.role === 'admin' ? children : <Navigate to="/account" replace />;
}
