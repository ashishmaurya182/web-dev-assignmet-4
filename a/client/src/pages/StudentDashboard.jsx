import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notify } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const formatDate = (value) => {
  if (!value) return 'TBA';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function StudentDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get('/my-registrations');
      setRegistrations(response.data || []);
    } catch (error) {
      notify(error.message || 'Unable to load registrations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancel = async (registrationId) => {
    try {
      await api.delete(`/registrations/${registrationId}`);
      notify('Registration cancelled successfully');
      fetchRegistrations();
    } catch (error) {
      notify(error.message || 'Unable to cancel registration.', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner className="min-h-[50vh]" />;
  }

  return (
    <div className="pb-16">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-red-200">Your account</div>
        <h1 className="text-3xl font-bold">My registrations</h1>
      </div>

      {registrations.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <h2 className="text-2xl font-semibold">You haven&apos;t registered for any events yet.</h2>
          <Link to="/" className="btn-primary mt-5">
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {registrations.map((registration) => (
            <div key={registration._id} className="glass-card p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{registration.eventTitle}</h2>
                    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${registration.status === 'upcoming' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-white/10 text-white/70'}`}>
                      {registration.status}
                    </span>
                  </div>
                  <div className="text-sm text-white/60">{registration.category}</div>
                </div>

                <div className="flex gap-3">
                  <button className="btn-danger" onClick={() => handleCancel(registration._id)}>
                    <Trash2 className="h-4 w-4" />
                    Cancel
                  </button>
                  <Link to={`/events/${registration.eventId}`} className="btn-secondary">
                    View event
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                  <CalendarDays className="mb-2 h-4 w-4 text-red-400" />
                  <div className="text-sm text-white/60">Date</div>
                  <div>{formatDate(registration.date)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                  <Clock3 className="mb-2 h-4 w-4 text-red-400" />
                  <div className="text-sm text-white/60">Time</div>
                  <div>{registration.startTime} {registration.endTime ? `- ${registration.endTime}` : ''}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                  <MapPin className="mb-2 h-4 w-4 text-red-400" />
                  <div className="text-sm text-white/60">Venue</div>
                  <div>{registration.venue}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                  <div className="text-sm text-white/60">Registered on</div>
                  <div>{new Date(registration.registeredAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
