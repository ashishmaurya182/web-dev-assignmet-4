import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { notify } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

export default function Participants() {
  const { id } = useParams();
  const [participants, setParticipants] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/events/${id}/participants?page=${page}&limit=50`);
        setParticipants(response.data || []);
        setPages(response.pages || 1);
        setTotal(response.total || 0);
      } catch (error) {
        notify(error.message || 'Unable to fetch participants.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [id, page]);

  if (loading) {
    return <LoadingSpinner className="min-h-[50vh]" />;
  }

  return (
    <div className="pb-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-red-200">Event</div>
          <h1 className="text-3xl font-bold">Participants</h1>
        </div>
        <div className="glass-card px-4 py-2 text-sm text-white/70">{total} total</div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/5 text-left text-sm uppercase tracking-[0.18em] text-white/50">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Student ID</th>
                <th className="px-5 py-4">Registration date</th>
              </tr>
            </thead>
            <tbody>
              {participants.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-10 text-center text-white/60">No participants registered yet.</td>
                </tr>
              ) : (
                participants.map((participant) => (
                  <tr key={participant._id} className="border-t border-white/10">
                    <td className="px-5 py-4">{participant.studentName}</td>
                    <td className="px-5 py-4">{participant.studentEmail}</td>
                    <td className="px-5 py-4">
                      {participant.studentId && participant.studentId !== 'N/A' ? participant.studentId : 'Not provided'}
                    </td>
                    <td className="px-5 py-4">{new Date(participant.registeredAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm text-white/60">
            Page {page} of {pages} · Showing {participants.length} of {total}
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page === 1}>
              Previous
            </button>
            <button className="btn-secondary" onClick={() => setPage((current) => Math.min(current + 1, pages))} disabled={page === pages}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
