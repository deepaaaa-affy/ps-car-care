import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

// One session for customers and admins. user.role decides what the screens show; the server checks every request.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { user: u } = await api('/auth/login', { method: 'POST', body: { email, password } });
    setUser(u);
    return u;
  };
  const signup = async (name, email, password) => {
    const { user: u } = await api('/auth/signup', { method: 'POST', body: { name, email, password } });
    setUser(u);
    return u;
  };
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, signup, logout }}>{children}</Ctx.Provider>;
}
