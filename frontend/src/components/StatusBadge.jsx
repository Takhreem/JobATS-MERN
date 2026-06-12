const STATUS_COLORS = {
  Applied: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Interview: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Selected: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const StatusBadge = ({ status }) => (
  <span className={`badge border ${STATUS_COLORS[status] || STATUS_COLORS.Applied}`}>
    {status}
  </span>
);

export default StatusBadge;
