import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { notify } from '../App';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${id}`);
        const event = response.data;
        setForm({
          title: event.title,
          description: event.description,
          category: event.category,
          date: event.date ? new Date(event.date).toISOString().slice(0, 10) : '',
          startTime: event.startTime,
          endTime: event.endTime || '',
          venue: event.venue,
          organizer: event.organizer,
          imageUrl: event.imageUrl || '',
          capacity: event.capacity || '',
          status: event.status,
        });
      } catch (error) {
        notify(error.message || 'Unable to load event.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.put(`/events/${id}`, {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
      });
      notify('Event updated successfully');
      navigate('/admin');
    } catch (error) {
      notify(error.message || 'Unable to update event.', 'error');
    }
  };

  if (loading || !form) {
    return <LoadingSpinner className="min-h-[50vh]" />;
  }

  return (
    <div className="pb-16">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit event</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card space-y-6 p-6 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/70">Event title</label>
            <input name="title" value={form.title} onChange={handleChange} className="input-field" required />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/70">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="textarea-field min-h-32" required />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="select-field">
              <option>Technical</option>
              <option>Cultural</option>
              <option>Sports</option>
              <option>Workshop</option>
              <option>Seminar</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="select-field">
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Start time</label>
            <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">End time</label>
            <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Venue</label>
            <input name="venue" value={form.venue} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Organizer</label>
            <input name="organizer" value={form.organizer} onChange={handleChange} className="input-field" required />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/70">Image URL</label>
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Capacity</label>
            <input type="number" min="1" name="capacity" value={form.capacity} onChange={handleChange} className="input-field" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>Cancel</button>
          <button type="submit" className="btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  );
}
