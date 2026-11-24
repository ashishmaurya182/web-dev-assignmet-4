import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Menu, Shield, Sparkles, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Events' },
    ...(user && user.role === 'student' ? [{ to: '/my-registrations', label: 'My Registrations' }] : []),
    ...(user && user.role === 'admin' ? [{ to: '/admin', label: 'Dashboard' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070707]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3 text-lg font-semibold text-white">
          <div className="app-mark flex h-10 w-10 items-center justify-center rounded-xl">
            <Sparkles className="app-mark-icon h-5 w-5" />
          </div>
          <div>EventEase</div>
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm transition ${isActive ? 'text-red-400' : 'text-white/70 hover:text-white'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                {user.role === 'admin' ? <Shield className="h-4 w-4 text-red-400" /> : <User className="h-4 w-4 text-red-400" />}
                {user.name}
              </div>
              <button className="btn-secondary" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-secondary">Login</NavLink>
              <NavLink to="/register" className="btn-primary">Register</NavLink>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#111111]/95 p-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className="text-white/80">
                {item.label}
              </NavLink>
            ))}
            {!user ? (
              <>
                <NavLink to="/login" onClick={() => setOpen(false)} className="btn-secondary w-full justify-center">Login</NavLink>
                <NavLink to="/register" onClick={() => setOpen(false)} className="btn-primary w-full justify-center">Register</NavLink>
              </>
            ) : (
              <button className="btn-secondary w-full justify-center" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
