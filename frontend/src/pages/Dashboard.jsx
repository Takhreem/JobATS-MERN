import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, accent = 'accent', icon }) => {
  const colors = {
    accent: 'from-accent/20 to-accent/5 border-accent/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[accent]} border rounded-xl p-6 animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className="text-2xl opacity-60">{icon}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/applications/stats');
        setStats(data);
      } catch (err) {
        toast.error('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader size="lg" />;
  if (!stats) return null;

  const total = Object.values(stats.statusBreakdown).reduce((a, b) => a + b, 0) || 1;
  const pct = (n) => Math.round((n / total) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-400 mt-1">
          {user.role === 'recruiter'
            ? "Here's an overview of your hiring pipeline"
            : "Track your applications and discover new opportunities"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={user.role === 'recruiter' ? 'Jobs Posted' : 'Jobs Available'}
          value={stats.totalJobs}
          accent="accent"
          icon="💼"
        />
        <StatCard
          label={user.role === 'recruiter' ? 'Total Applicants' : 'My Applications'}
          value={stats.totalApplications}
          accent="blue"
          icon="📋"
        />
        <StatCard
          label="In Interview"
          value={stats.statusBreakdown.Interview}
          accent="amber"
          icon="💬"
        />
        <StatCard
          label="Selected"
          value={stats.statusBreakdown.Selected}
          accent="emerald"
          icon="✅"
        />
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6">Application Pipeline</h2>
        <div className="space-y-4">
          {[
            { key: 'Applied', color: 'bg-blue-500', label: 'Applied' },
            { key: 'Interview', color: 'bg-amber-500', label: 'Interview' },
            { key: 'Selected', color: 'bg-emerald-500', label: 'Selected' },
            { key: 'Rejected', color: 'bg-red-500', label: 'Rejected' },
          ].map((stage) => (
            <div key={stage.key}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm font-medium text-gray-200">{stage.label}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {stats.statusBreakdown[stage.key]} ({pct(stats.statusBreakdown[stage.key])}%)
                </span>
              </div>
              <div className="h-2 bg-bg-elev rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} transition-all duration-500`}
                  style={{ width: `${pct(stats.statusBreakdown[stage.key])}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/jobs"
          className="card hover:bg-bg-elev flex items-center justify-between group"
        >
          <div>
            <h3 className="text-lg font-semibold text-white">
              {user.role === 'recruiter' ? 'Manage Jobs' : 'Browse Jobs'}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {user.role === 'recruiter'
                ? 'Create and manage your job listings'
                : 'Find and apply to new opportunities'}
            </p>
          </div>
          <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        <Link
          to="/applications"
          className="card hover:bg-bg-elev flex items-center justify-between group"
        >
          <div>
            <h3 className="text-lg font-semibold text-white">
              {user.role === 'recruiter' ? 'Review Applicants' : 'My Applications'}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {user.role === 'recruiter'
                ? 'View candidates and update their status'
                : 'Track the status of your applications'}
            </p>
          </div>
          <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
