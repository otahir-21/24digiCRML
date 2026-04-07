import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROUTES, sanitizeLoginNext } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeWorkspaceGate from './components/EmployeeWorkspaceGate';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    const returnPath = `${location.pathname}${location.search}`;
    const safeReturn = sanitizeLoginNext(returnPath);
    const loginTo = safeReturn
      ? `${ROUTES.LOGIN}?next=${encodeURIComponent(safeReturn)}`
      : ROUTES.LOGIN;
    return <Navigate to={loginTo} replace />;
  }

  return children;
}

/** /employee/:slug — employees only (crm_employees); admins are redirected to the main dashboard */
function EmployeeDashboardRoute() {
  const { slug } = useParams();
  return (
    <ProtectedRoute>
      <EmployeeWorkspaceGate>
        <Dashboard employeeSlug={slug || ''} />
      </EmployeeWorkspaceGate>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/employee/:slug" element={<EmployeeDashboardRoute />} />
          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
