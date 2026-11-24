import { useState } from 'react';
import { ArrowRight, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notify } from '../App';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', studentId: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await register(form);
      notify('Registration successful');
      navigate('/');
    } catch (error) {
      notify(error.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl pb-16">
      <div className="glass-card p-8 sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-red-200">Join EventEase</div>
            <h1 className="text-3xl font-bold">Create account</h1>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-white/70">Full name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="Your name" required />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="you@example.com" autoComplete="email" required />
            <p className="mt-2 text-xs text-white/50">Personal email addresses are welcome. You don&apos;t need a college email to join.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70" htmlFor="student-id">Student ID <span className="text-white/40">(optional)</span></label>
            <input id="student-id" type="text" name="studentId" value={form.studentId} onChange={handleChange} className="input-field" placeholder="Leave blank if you don’t have one" maxLength={80} />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="input-field" placeholder="••••••••" required minLength={6} />
          </div>

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link to="/login" className="text-red-300">Login</Link>
        </div>
      </div>
    </div>
  );
}
