import { useState } from 'react';
import { ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notify } from '../App';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithOtp, requestLoginOtp } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [method, setMethod] = useState('password');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(form);
      notify('Signed in successfully.');
      navigate('/');
    } catch (error) {
      notify(error.message || 'Sign in failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await requestLoginOtp({ email: form.email });
      if (!response.delivered) {
        throw new Error('The sign-in code was not delivered. Please try again.');
      }
      setOtpSent(true);
      notify(response.message || 'A sign-in code was sent to your email.');
    } catch (error) {
      notify(error.message || 'Unable to send a sign-in code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await loginWithOtp({ email: form.email, otp });
      notify('Signed in successfully.');
      navigate('/');
    } catch (error) {
      notify(error.message || 'Code verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const chooseMethod = (nextMethod) => {
    setMethod(nextMethod);
    setOtpSent(false);
    setOtp('');
  };

  return (
    <div className="mx-auto max-w-xl pb-16">
      <div className="glass-card p-8 sm:p-10">
        <div className="mb-7 flex items-center gap-3">
          <div className="app-mark flex h-12 w-12 items-center justify-center rounded-xl">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-red-200">Welcome back</div>
            <h1 className="text-3xl font-bold">Sign in to EventEase</h1>
          </div>
        </div>

        <p className="mb-5 text-sm text-white/60">Students and admins can sign in with a password or a one-time email code.</p>

        <div className="auth-method-switch" role="group" aria-label="Sign-in method">
          <button
            type="button"
            aria-pressed={method === 'password'}
            className={method === 'password' ? 'auth-method is-active' : 'auth-method'}
            onClick={() => chooseMethod('password')}
          >
            <KeyRound className="h-4 w-4" />
            Password
          </button>
          <button
            type="button"
            aria-pressed={method === 'otp'}
            className={method === 'otp' ? 'auth-method is-active' : 'auth-method'}
            onClick={() => chooseMethod('otp')}
          >
            <Mail className="h-4 w-4" />
            Email code
          </button>
        </div>

        {method === 'password' ? (
          <form className="space-y-5" onSubmit={handlePasswordLogin}>
            <div>
              <label className="mb-2 block text-sm text-white/70" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="name@college.edu"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm text-white/70" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="text-sm text-red-200 transition hover:text-white">Forgot password?</Link>
              </div>
              <input
                id="login-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={otpSent ? handleOtpLogin : handleRequestOtp}>
            <div>
              <label className="mb-2 block text-sm text-white/70" htmlFor="otp-login-email">Email</label>
              <input
                id="otp-login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="name@college.edu"
                autoComplete="email"
                required
              />
            </div>

            {otpSent && (
              <div>
                <label className="mb-2 block text-sm text-white/70" htmlFor="login-otp">6-digit verification code</label>
                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field tracking-[0.35em]"
                  placeholder="000000"
                  required
                />
                <p className="mt-2 text-xs text-white/50">If an account exists for this address, its code will arrive by email and expire in 10 minutes.</p>
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? (otpSent ? 'Verifying...' : 'Sending code...') : (otpSent ? 'Verify and sign in' : 'Send sign-in code')}
              <ArrowRight className="h-4 w-4" />
            </button>

            {otpSent && (
              <button type="button" className="btn-secondary w-full justify-center" onClick={handleRequestOtp} disabled={loading}>
                Send another code
              </button>
            )}
          </form>
        )}

        <div className="mt-6 text-center text-sm text-white/60">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-red-300">Create one</Link>
        </div>
      </div>
    </div>
  );
}
