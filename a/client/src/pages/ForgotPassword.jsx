import { useState } from 'react';
import { ArrowLeft, ArrowRight, KeyRound, MailCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notify } from '../App';
import api from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestCode = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/password/forgot', { email });
      if (!response.delivered) {
        throw new Error('The reset code was not delivered. Please try again.');
      }
      setCodeSent(true);
      notify(response.message || 'A password reset code was sent to your email.');
    } catch (error) {
      notify(error.message || 'Unable to send a password reset code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      notify('The passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/password/reset', { email, otp, password });
      notify(response.message || 'Password reset successfully.');
      navigate('/login');
    } catch (error) {
      notify(error.message || 'Unable to reset your password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl pb-16">
      <div className="glass-card p-8 sm:p-10">
        <div className="mb-7 flex items-center gap-3">
          <div className="app-mark flex h-12 w-12 items-center justify-center rounded-xl">
            {codeSent ? <MailCheck className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-red-200">Account recovery</div>
            <h1 className="text-3xl font-bold">{codeSent ? 'Choose a new password' : 'Forgot your password?'}</h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-6 text-white/60">
          {codeSent
            ? 'Enter the one-time code from your email and choose a new password.'
            : 'We’ll email you a one-time code to verify your account before you reset your password.'}
        </p>

        {!codeSent ? (
          <form className="space-y-5" onSubmit={requestCode}>
            <div>
              <label className="mb-2 block text-sm text-white/70" htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field"
                placeholder="name@college.edu"
                autoComplete="email"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Sending code...' : 'Send reset code'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={resetPassword}>
            <div>
              <label className="mb-2 block text-sm text-white/70" htmlFor="reset-code">6-digit verification code</label>
              <input
                id="reset-code"
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
              <p className="mt-2 text-xs text-white/50">Sent to {email}. The code expires in 10 minutes.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/70" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/70" htmlFor="confirm-new-password">Confirm new password</label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="input-field"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Resetting password...' : 'Verify code and reset password'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <button
                type="button"
                className="text-red-200 transition hover:text-white"
                onClick={() => {
                  setCodeSent(false);
                  setOtp('');
                  setPassword('');
                  setConfirmPassword('');
                }}
              >
                Use a different email
              </button>
              <button type="button" className="text-red-200 transition hover:text-white" onClick={requestCode} disabled={loading}>
                Send a new code
              </button>
            </div>
          </form>
        )}

        <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
