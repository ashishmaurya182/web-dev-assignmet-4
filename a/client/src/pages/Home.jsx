import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { notify } from '../App';
import api from '../services/api';

const categoryOptions = ['All', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'];
const statusOptions = ['All', 'upcoming', 'completed'];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const nextEvent = events.find((event) => event.status === 'upcoming');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category && category !== 'All') params.set('category', category);
      if (status && status !== 'All') params.set('status', status);

      const response = await api.get(`/events?${params.toString()}`);
      setEvents(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, category, status]);

  return (
    <div className="space-y-8 pb-16">
      <section className="hero-panel">
        <div className="hero-grid-lines" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-kicker"><span /> EventEase <span className="hero-kicker-divider">/</span> Campus calendar</div>
          <h1 className="hero-title">Make time for <em>what&apos;s happening.</em></h1>
          <p className="hero-description">
            The talks, shows, workshops, and little campus moments worth showing up for.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#events" className="btn-primary">
              Browse events
              <ArrowRight className="h-4 w-4" />
            </a>
            <button
              className="btn-secondary"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                } else if (user.role === 'admin') {
                  navigate('/admin/events/new');
                } else {
                  notify('Only administrators can organize events.', 'error');
                }
              }}
            >
              Organize an event
            </button>
          </div>
        </div>

        <aside className="hero-agenda" aria-label="Campus event preview">
          <div className="hero-agenda-heading">
            <span>Next on the calendar</span>
            <CalendarDays className="h-4 w-4" />
          </div>
          {nextEvent ? (
            <>
              <p className="hero-agenda-date">
                {new Date(nextEvent.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <h2>{nextEvent.title}</h2>
              <div className="hero-agenda-meta">
                <span>{nextEvent.startTime}</span>
                <span className="hero-meta-dot" />
                <MapPin className="h-3.5 w-3.5" />
                <span>{nextEvent.venue}</span>
              </div>
              <Link to={`/events/${nextEvent._id}`} className="hero-agenda-link">
                Get the details <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="hero-agenda-date">A little space on your calendar</p>
              <h2>Your next favorite thing is around the corner.</h2>
              <p className="hero-agenda-empty">Check back soon for something worth showing up for.</p>
            </>
          )}
          <div className="hero-agenda-footer">
            <span><strong>{events.length}</strong> events listed</span>
            <span><strong>{events.filter((event) => event.status === 'upcoming').length}</strong> coming up</span>
          </div>
        </aside>
      </section>

      <section id="events" className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="events-heading">
            <p className="events-eyebrow">Find your next thing</p>
            <h2 className="section-title">Around campus</h2>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="relative block">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                placeholder="Search events..."
              />
            </label>

            <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-field">
              {categoryOptions.map((option) => (
                <option key={option} value={option}>{option === 'All' ? 'All Categories' : option}</option>
              ))}
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)} className="select-field">
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option === 'All' ? 'All Status' : option}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner className="min-h-[20vh]" />
        ) : error ? (
          <div className="glass-card p-8 text-center text-red-200">{error}</div>
        ) : events.length === 0 ? (
          <div className="glass-card p-10 text-center text-white/70">
            <div className="text-xl font-semibold text-white">No events found</div>
            <p className="mt-2">Try changing your search or category filter.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
