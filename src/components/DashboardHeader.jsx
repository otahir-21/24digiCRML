import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants';
import './Dashboard.css';

/**
 * @param {{ variant?: 'admin' | 'employee', employeeReturnPath?: string | null }} props
 */
export default function DashboardHeader({ variant = 'admin', employeeReturnPath = null }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isEmployee = variant === 'employee';

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const userInitial = (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    if (employeeReturnPath) {
      navigate(`${ROUTES.LOGIN}?next=${encodeURIComponent(employeeReturnPath)}`, { replace: true });
    } else {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <header
      className={`dashboard-header ${isEmployee ? 'dashboard-header--employee' : ''}`}
      aria-label={isEmployee ? 'Workspace header' : 'Application header'}
    >
      <div className="header-left">
        <div className="header-product-lockup">
          <span className="header-product-name">{isEmployee ? '24Digi' : '24Digi CRM'}</span>
          <span className="header-product-tag">{isEmployee ? 'Workspace' : 'Administration'}</span>
        </div>
        <div className="header-greeting">
          <span className="header-greeting-label">Signed in as</span>
          <span className="header-greeting-name">Welcome, {displayName}</span>
        </div>
      </div>
      <div className="user-section">
        <div className="user-info" role="group" aria-label="Account">
          <span className="user-avatar" aria-hidden="true">{userInitial}</span>
          <div className="user-info-text">
            <span className="user-email">{user?.email ?? '—'}</span>
            <span className={`user-role-pill ${isEmployee ? 'user-role-pill--employee' : ''}`}>
              {isEmployee ? 'Employee' : 'Administrator'}
            </span>
          </div>
        </div>
        <button type="button" onClick={handleSignOut} className="logout-btn">
          Sign out
        </button>
      </div>
    </header>
  );
}
