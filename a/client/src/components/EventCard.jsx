import { ArrowUpRight, CalendarDays, MapPin, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatDate = (value) => {
  if (!value) return 'TBA';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function EventCard({ event }) {
  const eventDate = event.date ? new Date(event.date) : null;
  const remainingSeats = event.remainingSeats ?? event.availableSeats;
  const hasSeatLimit = remainingSeats !== null && remainingSeats !== undefined;
  const canRegister = event.status === 'upcoming' && (!hasSeatLimit || remainingSeats > 0);
  const availability = hasSeatLimit
    ? remainingSeats > 0 ? `${remainingSeats} spots left` : 'Fully booked'
    : 'Open registration';

  return (
    <article className="event-card glass-card group">
      <Link to={`/events/${event._id}`} className="event-image-link" aria-label={`View ${event.title}`}>
        <div className="event-image-wrap">
          <img src={event.imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'} alt={event.title} className="event-image" />
          <div className="event-image-shade" />
          <div className="event-card-labels">
            <span className="event-category">
            {event.category}
            </span>
            <span className={`event-status ${event.status === 'upcoming' ? 'is-upcoming' : 'is-completed'}`}>
              <span className="event-status-dot" />
              {event.status}
            </span>
          </div>
          {eventDate && (
            <div className="event-date-badge">
              <span>{eventDate.toLocaleDateString(undefined, { month: 'short' })}</span>
              <strong>{eventDate.toLocaleDateString(undefined, { day: '2-digit' })}</strong>
            </div>
          )}
        </div>
      </Link>

      <div className="event-card-content">
        <div className="event-card-heading">
          <h3>{event.title}</h3>
          <p>{event.description}</p>
        </div>

        <div className="event-details">
          <div>
            <CalendarDays className="h-4 w-4" />
            {formatDate(event.date)}
          </div>
          <div>
            <MapPin className="h-4 w-4" />
            {event.venue}
          </div>
        </div>

        <div className="event-card-footer">
          <span className="event-organizer">{event.organizer}</span>
          <div className="event-card-actions">
            <span className="event-spots">{availability}</span>
            <Link
              to={`/events/${event._id}`}
              className="event-card-action"
              aria-label={`${canRegister ? 'Register for' : 'View'} ${event.title}`}
              title={canRegister ? 'Register for this event' : 'View event details'}
            >
              <Ticket className="h-4 w-4" />
              <span>{canRegister ? 'Register' : 'View event'}</span>
              <ArrowUpRight className="event-action-arrow h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
