import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin, ShieldCheck, Ticket, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { notify } from '../App';

const formatDate = (value) => {
  if (!value) return 'TBA';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    setStudentId(user?.studentId || '');
  }, [user?.studentId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      notify(error.message || 'Unable to load this event.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setRegistering(true);
      await api.post(`/events/${id}/register`, { studentId: studentId.trim() });
      notify('Registration successful!');
      fetchEvent();
    } catch (error) {
      notify(error.message || 'Unable to register for this event.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="min-h-[40vh]" />;
  }

  if (!event) {
    return <div className="glass-card p-8 text-center text-red-200">Event not found.</div>;
  }

  const canRegister = event.status === 'upcoming' && !event.isRegistered && (event.remainingSeats === null || event.remainingSeats > 0);

  return (
    <div className="space-y-8 pb-16">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-glow">
        <img src={event.imageUrl} alt={event.title} className="h-72 w-full object-cover sm:h-96" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-100">
              {event.category}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${event.status === 'upcoming' ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200' : 'border-white/20 bg-white/10 text-white/80'}`}>
              {event.status}
            </span>
          </div>

          <h1 className="page-heading">{event.title}</h1>
          <p className="text-lg text-white/70">{event.description}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-card p-4">
              <CalendarDays className="mb-2 h-5 w-5 text-red-400" />
              <div className="text-sm text-white/60">Date</div>
              <div className="font-medium">{formatDate(event.date)}</div>
            </div>
            <div className="glass-card p-4">
              <Clock3 className="mb-2 h-5 w-5 text-red-400" />
              <div className="text-sm text-white/60">Time</div>
              <div className="font-medium">{event.startTime} {event.endTime ? `- ${event.endTime}` : ''}</div>
            </div>
            <div className="glass-card p-4">
              <MapPin className="mb-2 h-5 w-5 text-red-400" />
              <div className="text-sm text-white/60">Venue</div>
              <div className="font-medium">{event.venue}</div>
            </div>
            <div className="glass-card p-4">
              <Users className="mb-2 h-5 w-5 text-red-400" />
              <div className="text-sm text-white/60">Organizer</div>
              <div className="font-medium">{event.organizer}</div>
            </div>
          </div>
        </div>

        <aside className="glass-card h-fit p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Capacity</span>
              <span className="font-semibold">{event.capacity ? event.capacity : 'Unlimited'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Registered</span>
              <span className="font-semibold">{event.registeredCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Available seats</span>
              <span className="font-semibold">{event.remainingSeats !== null ? event.remainingSeats : 'Open'}</span>
            </div>

            {event.status === 'completed' ? (
              <button className="btn-secondary w-full cursor-not-allowed justify-center" disabled>
                <ShieldCheck className="h-4 w-4" />
                Event Completed
              </button>
            ) : event.isRegistered ? (
              <button className="btn-secondary w-full cursor-not-allowed justify-center" disabled>
                <Ticket className="h-4 w-4" />
                Already Registered
              </button>
            ) : event.remainingSeats === 0 ? (
              <button className="btn-secondary w-full cursor-not-allowed justify-center" disabled>
                <Ticket className="h-4 w-4" />
                Event Full
              </button>
            ) : user?.role === 'admin' ? (
              <button className="btn-secondary w-full cursor-not-allowed justify-center" disabled>
                <ShieldCheck className="h-4 w-4" />
                Organizers cannot register
              </button>
            ) : (
              <>
                {user && user.role === 'student' && (
                  <div>
                    <label className="mb-2 block text-sm text-white/70" htmlFor="event-student-id">
                      Student ID <span className="text-white/40">(optional)</span>
                    </label>
                    <input
                      id="event-student-id"
                      type="text"
                      value={studentId}
                      onChange={(inputEvent) => setStudentId(inputEvent.target.value)}
                      className="input-field"
                      placeholder="Leave blank if you don’t have one"
                      maxLength={80}
                    />
                    <p className="mt-2 text-xs text-white/50">
                      Register with your account email. No college ID is needed.
                    </p>
                  </div>
                )}
                <button className="btn-primary w-full justify-center" onClick={handleRegister} disabled={registering}>
                  <Ticket className="h-4 w-4" />
                  {registering ? 'Registering...' : 'Register for Event'}
                </button>
              </>
            )}

            <Link to="/" className="btn-secondary w-full justify-center">
              Back to Events
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
