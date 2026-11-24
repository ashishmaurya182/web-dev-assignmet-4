import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import Participants from './pages/Participants';
import StudentDashboard from './pages/StudentDashboard';

export const notify = (message, type = 'success') => {
  window.dispatchEvent(new CustomEvent('eventease-toast', { detail: { message, type } }));
};

export default function App() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleToast = (event) => {
      const { message, type } = event.detail || {};
      setToast({ message, type });
    };

    window.addEventListener('eventease-toast', handleToast);
    return () => window.removeEventListener('eventease-toast', handleToast);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="app-shell min-h-screen text-white">
      <div className="ambient-bg" />
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-registrations" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/events/new" element={<ProtectedRoute adminOnly><CreateEvent /></ProtectedRoute>} />
          <Route path="/admin/events/:id/edit" element={<ProtectedRoute adminOnly><EditEvent /></ProtectedRoute>} />
          <Route path="/admin/events/:id/participants" element={<ProtectedRoute adminOnly><Participants /></ProtectedRoute>} />
        </Routes>
      </main>

      <Footer />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`rounded-xl border px-4 py-3 shadow-lg ${toast.type === 'error' ? 'border-red-500/40 bg-red-500/15 text-red-100' : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
