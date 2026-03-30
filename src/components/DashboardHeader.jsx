import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants';
import './Dashboard.css';

export default function DashboardHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const userInitial = (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <span className="welcome-text">Welcome, {displayName}</span>
        <h1>24Digi CRM</h1>
      </div>
      <div className="user-section">
        <div className="user-info">
          <span className="user-avatar">{userInitial}</span>
          <span className="user-email">{user?.email}</span>
        </div>
        <button onClick={handleSignOut} className="logout-btn">Sign out</button>
      </div>
    </header>
  );
}
