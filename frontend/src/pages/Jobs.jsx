import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const JobForm = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState(
    initial || { title: '', company: '', location: '', salary: '', description: '' }
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) {
        const { data } = await api.put(`/jobs/${initial._id}`, form);
        toast.success('Job updated');
        onSave(data, 'update');
      } else {
        const { data } = await api.post('/jobs', form);
        toast.success('Job created');
        onSave(data, 'create');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{initial ? 'Edit Job' : 'Create Job'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input
              required
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Company *</label>
              <input
                required
                className="input"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
              <input
                required
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Salary</label>
            <input
              className="input"
              placeholder="e.g. ₹8-12 LPA"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
            <textarea
              required
              rows={6}
              className="input resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : initial ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApplyModal = ({ job, onClose, onApplied }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a resume file');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      await api.post(`/applications/${job._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Application submitted!');
      onApplied();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-card border border-border rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Apply for {job.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="bg-bg-elev border border-border rounded-lg p-4">
            <p className="text-sm font-medium text-white">{job.company}</p>
            <p className="text-sm text-gray-400">
              {job.location} · {job.salary}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Resume (PDF, DOC, DOCX · max 5MB)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="input file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-accent file:text-white file:cursor-pointer file:text-sm"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={uploading} className="btn-primary">
              {uploading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ title: '', location: '' });
  const [editingJob, setEditingJob] = useState(null);
  const [creatingJob, setCreatingJob] = useState(false);
  const [applyingTo, setApplyingTo] = useState(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.title) params.title = search.title;
      if (search.location) params.location = search.location;

      const url = user.role === 'recruiter' ? '/jobs/my/listings' : '/jobs';
      const { data } = await api.get(url, { params });
      setJobs(data);

      if (user.role === 'candidate') {
        const { data: apps } = await api.get('/applications/my');
        setMyApplications(apps);
      }
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadJobs();
  };

  const handleClearSearch = () => {
    setSearch({ title: '', location: '' });
    setTimeout(loadJobs, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job and all its applications?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job deleted');
      setJobs(jobs.filter((j) => j._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleJobSaved = (job, mode) => {
    if (mode === 'create') setJobs([job, ...jobs]);
    else setJobs(jobs.map((j) => (j._id === job._id ? job : j)));
  };

  const hasApplied = (jobId) => myApplications.some((a) => a.jobId?._id === jobId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {user.role === 'recruiter' ? 'My Job Listings' : 'Browse Jobs'}
          </h1>
          <p className="text-gray-400 mt-1">
            {user.role === 'recruiter'
              ? 'Manage your job postings'
              : 'Discover and apply to open positions'}
          </p>
        </div>
        {user.role === 'recruiter' && (
          <button onClick={() => setCreatingJob(true)} className="btn-primary">
            + Create Job
          </button>
        )}
      </div>

      {user.role === 'candidate' && (
        <form onSubmit={handleSearch} className="card mb-6 flex flex-wrap gap-3">
          <input
            className="input flex-1 min-w-[200px]"
            placeholder="Search by title..."
            value={search.title}
            onChange={(e) => setSearch({ ...search, title: e.target.value })}
          />
          <input
            className="input flex-1 min-w-[200px]"
            placeholder="Filter by location..."
            value={search.location}
            onChange={(e) => setSearch({ ...search, location: e.target.value })}
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
          {(search.title || search.location) && (
            <button type="button" onClick={handleClearSearch} className="btn-secondary">
              Clear
            </button>
          )}
        </form>
      )}

      {loading ? (
        <Loader size="lg" />
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No jobs found.</p>
          {user.role === 'recruiter' && (
            <button onClick={() => setCreatingJob(true)} className="btn-primary mt-4">
              Create your first job
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job._id} className="card flex flex-col animate-slide-up">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                </div>
                <p className="text-sm text-accent font-medium mb-2">{job.company}</p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-3">
                  <span className="bg-bg-elev px-2 py-1 rounded">📍 {job.location}</span>
                  {job.salary && job.salary !== 'Not disclosed' && (
                    <span className="bg-bg-elev px-2 py-1 rounded">💰 {job.salary}</span>
                  )}
                </div>
                <p className="text-sm text-gray-300 line-clamp-3 whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                {user.role === 'recruiter' ? (
                  <>
                    <button
                      onClick={() => setEditingJob(job)}
                      className="btn-secondary text-sm flex-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job._id)}
                      className="btn-danger text-sm flex-1"
                    >
                      Delete
                    </button>
                  </>
                ) : hasApplied(job._id) ? (
                  <button disabled className="btn-secondary text-sm w-full cursor-not-allowed">
                    ✓ Applied
                  </button>
                ) : (
                  <button onClick={() => setApplyingTo(job)} className="btn-primary text-sm w-full">
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {creatingJob && (
        <JobForm onClose={() => setCreatingJob(false)} onSave={handleJobSaved} />
      )}
      {editingJob && (
        <JobForm
          initial={editingJob}
          onClose={() => setEditingJob(null)}
          onSave={handleJobSaved}
        />
      )}
      {applyingTo && (
        <ApplyModal
          job={applyingTo}
          onClose={() => setApplyingTo(null)}
          onApplied={loadJobs}
        />
      )}
    </div>
  );
};

export default Jobs;
