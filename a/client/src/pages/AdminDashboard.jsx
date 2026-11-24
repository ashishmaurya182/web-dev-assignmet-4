import { useEffect, useState } from 'react';
import { CalendarCheck2, Edit, Eye, Plus, Trash2, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notify } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data || []);
    } catch (error) {
      notify(error.message || 'Unable to load dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const totalRegistrations = events.reduce((sum, event) => sum + (event.registeredCount || 0), 0);

  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this event? This will also remove its registrations.')) {
      return;
    }

    try {
      await api.delete(`/events/${eventId}`);
      notify('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      notify(error.message || 'Delete failed.', 'error');
    }
  };

  const handleToggleStatus = async (event) => {
    try {
      await api.put(`/events/${event._id}`, {
        ...event,
        status: event.status === 'completed' ? 'upcoming' : 'completed',
      });
      notify('Event status updated');
      fetchEvents();
    } catch (error) {
      notify(error.message || 'Unable to update status.', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-red-200">Overview</div>
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/admin/events/new')}>
          <Plus className="h-4 w-4" />
          Create event
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card p-5">
          <div className="text-sm text-white/60">Total events</div>
          <div className="mt-2 text-3xl font-bold">{events.length}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-sm text-white/60">Upcoming</div>
          <div className="mt-2 text-3xl font-bold">{events.filter((event) => event.status === 'upcoming').length}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-sm text-white/60">Completed</div>
          <div className="mt-2 text-3xl font-bold">{events.filter((event) => event.status === 'completed').length}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-sm text-white/60">Registrations</div>
          <div className="mt-2 text-3xl font-bold">{totalRegistrations}</div>
        </div>
      </div>

      <div className="glass-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Events</h2>
        </div>

        <div className="space-y-4">
          {events.map((event) => (
            <div key={event._id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${event.status === 'upcoming' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-white/10 text-white/70'}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-white/70">{event.category} • {new Date(event.date).toLocaleDateString()} • {event.venue}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/admin/events/${event._id}/participants`} className="btn-secondary">
                    <Users className="h-4 w-4" />
                    Participants
                  </Link>
                  <Link to={`/admin/events/${event._id}/edit`} className="btn-secondary">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                  <button className="btn-secondary" onClick={() => handleToggleStatus(event)}>
                    <CalendarCheck2 className="h-4 w-4" />
                    {event.status === 'completed' ? 'Mark upcoming' : 'Mark completed'}
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(event._id)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                  <Link to={`/events/${event._id}`} className="btn-secondary">
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
