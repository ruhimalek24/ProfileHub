import './StatCard.css';

// Small card with one number. Used on the dashboard.
function StatCard({ label, value, icon, hint }) {
  return (
    <div className="stat-card card">
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {icon && (
          <span className="stat-card-icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className="stat-card-value">{value}</p>
      {hint && <p className="stat-card-hint">{hint}</p>}
    </div>
  );
}

export default StatCard;
