import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAdmin, RequireUser } from './components/Guards';
import PublicLayout from './components/PublicLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import AcceptInvite from './pages/AcceptInvite';
import Book from './pages/Book';
import Account from './pages/Account';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Staff area: admins log in on the normal /login page */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin/*" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Home />} />
          <Route path="signup" element={<Home />} />
          <Route path="accept-invite" element={<AcceptInvite />} />
          <Route path="book" element={<RequireUser><Book /></RequireUser>} />
          <Route path="account" element={<RequireUser><Account /></RequireUser>} />
          <Route path="*" element={<section className="view on"><div className="wrap"><h2>Page not found</h2></div></section>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
