import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Applied', 'Interview', 'Selected', 'Rejected'];

const InterviewModal = ({ application, onClose }) => {
  const [date, setDate] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/applications/${application._id}/interview`, { date, feedback });
      toast.success('Interview scheduled');
      onClose(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-card border border-border rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Schedule Interview</h2>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Candidate: {application.userId?.name}
            </label>
            <p className="text-xs text-gray-400">{application.jobId?.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interview Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes / Feedback</label>
            <textarea
              rows={4}
              className="input resize-none"
              placeholder="Optional notes..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => onClose(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [schedulingFor, setSchedulingFor] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const url = user.role === 'recruiter' ? '/applications/recruiter' : '/applications/my';
      const { data } = await api.get(url);
      setApplications(data);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/applications/${id}/status`, { status });
      setApplications(applications.map((a) => (a._id === id ? { ...a, status } : a)));
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDownloadResume = async (id, candidateName) => {
    try {
      const res = await api.get(`/applications/${id}/resume`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume-${candidateName || 'candidate'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download resume');
    }
  };

  const filtered =
    filter === 'All' ? applications : applications.filter((a) => a.status === filter);

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">
          {user.role === 'recruiter' ? 'Applicants' : 'My Applications'}
        </h1>
        <p className="text-gray-400 mt-1">
          {user.role === 'recruiter'
            ? 'Review candidates and manage their status'
            : 'Track the progress of your job applications'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['All', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-accent text-white'
                : 'bg-bg-elev text-gray-300 hover:bg-bg-card border border-border'
            }`}
          >
            {s} {s !== 'All' && <span className="opacity-70">({counts[s]})</span>}
            {s === 'All' && <span className="opacity-70">({applications.length})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader size="lg" />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No applications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div key={app._id} className="card animate-slide-up">
              <div className="flex flex-wrap gap-4 justify-between items-start">
                <div className="flex-1 min-w-[250px]">
                  {user.role === 'recruiter' ? (
                    <>
                      <h3 className="text-lg font-semibold text-white">
                        {app.userId?.name || 'Unknown candidate'}
                      </h3>
                      <p className="text-sm text-gray-400">{app.userId?.email}</p>
                      <p className="text-sm text-accent mt-2">
                        Applied for: {app.jobId?.title} @ {app.jobId?.company}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-white">{app.jobId?.title}</h3>
                      <p className="text-sm text-accent font-medium">{app.jobId?.company}</p>
                      <p className="text-sm text-gray-400 mt-1">📍 {app.jobId?.location}</p>
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Applied on {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <StatusBadge status={app.status} />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleDownloadResume(app._id, app.userId?.name)}
                      className="btn-secondary text-xs"
                    >
                      📄 Resume
                    </button>
                    {user.role === 'recruiter' && (
                      <>
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app._id, e.target.value)}
                          className="input py-1.5 text-xs w-auto"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setSchedulingFor(app)}
                          className="btn-primary text-xs"
                        >
                          📅 Interview
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {schedulingFor && (
        <InterviewModal
          application={schedulingFor}
          onClose={(refresh) => {
            setSchedulingFor(null);
            if (refresh) load();
          }}
        />
      )}
    </div>
  );
};

export default Applications;
