import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const linkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'bg-accent/10 text-accent'
        : 'text-gray-300 hover:text-white hover:bg-bg-elev'
    }`;

  if (!user) return null;

  return (
    <nav className="bg-bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">J</span>
              </div>
              <span className="text-lg font-bold text-white">JobATS</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link to="/dashboard" className={linkClass('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/jobs" className={linkClass('/jobs')}>
                Jobs
              </Link>
              <Link to="/applications" className={linkClass('/applications')}>
                Applications
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-sm font-semibold text-accent">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
