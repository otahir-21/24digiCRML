import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, DEFAULT_EMAIL, DEFAULT_PASSWORD } from '../context/AuthContext';
import {
  CRM_EMPLOYEES_COLLECTION,
  ROUTES,
  employeePortalPath,
  sanitizeLoginNext,
  parseEmployeeSlugFromLoginNext,
} from '../constants';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import './Login.css';

function slugifyFallback(value) {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'employee'
  );
}

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const portal = searchParams.get('portal')?.trim();
    if (!portal || searchParams.get('next')) return;
    const p = new URLSearchParams(searchParams);
    p.delete('portal');
    p.set('next', employeePortalPath(portal));
    setSearchParams(p, { replace: true });
  }, [searchParams, setSearchParams]);

  const nextPath = useMemo(() => sanitizeLoginNext(searchParams.get('next')), [searchParams]);

  const isEmployeeWorkspaceLogin = useMemo(() => {
    const portalLegacy = searchParams.get('portal')?.trim();
    return Boolean(
      (nextPath && nextPath.startsWith('/employee/')) || portalLegacy,
    );
  }, [nextPath, searchParams]);

  const workspaceSlugDisplay = useMemo(() => {
    const fromNext = parseEmployeeSlugFromLoginNext(nextPath || '');
    if (fromNext) return fromNext;
    const portal = searchParams.get('portal')?.trim();
    return portal || '';
  }, [nextPath, searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  useEffect(() => {
    if (isEmployeeWorkspaceLogin) {
      setEmail((prev) => (prev === DEFAULT_EMAIL ? '' : prev));
      setPassword((prev) => (prev === DEFAULT_PASSWORD ? '' : prev));
    } else {
      setEmail(DEFAULT_EMAIL);
      setPassword(DEFAULT_PASSWORD);
    }
  }, [isEmployeeWorkspaceLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const signedInUser = await signIn(email, password);
      const employeeSnap = await getDoc(doc(db, CRM_EMPLOYEES_COLLECTION, signedInUser.uid));
      const nextParam = sanitizeLoginNext(searchParams.get('next'));

      if (employeeSnap.exists()) {
        const employee = employeeSnap.data() || {};
        const isActive = employee.active !== false;
        const role = String(employee.role || '').toLowerCase();
        if (isActive && role === 'employee') {
          const slug =
            employee.portalSlug || slugifyFallback(employee.fullName || signedInUser.email?.split('@')[0]);
          const employeePath = employeePortalPath(slug);
          if (nextParam && nextParam.startsWith('/employee/')) {
            const requestedSlug = parseEmployeeSlugFromLoginNext(nextParam);
            if (
              requestedSlug &&
              String(slug).toLowerCase() === String(requestedSlug).toLowerCase()
            ) {
              navigate(nextParam, { replace: true });
              return;
            }
          }
          navigate(employeePath, { replace: true });
          return;
        }
      }

      if (
        nextParam &&
        (nextParam === ROUTES.DASHBOARD || nextParam.startsWith(`${ROUTES.DASHBOARD}?`))
      ) {
        navigate(nextParam, { replace: true });
        return;
      }

      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className={`login-card ${isEmployeeWorkspaceLogin ? 'login-card--workspace' : ''}`}>
        <div className="login-header">
          {isEmployeeWorkspaceLogin ? (
            <>
              <p className="login-kicker">24Digi</p>
              <h1>Workspace sign-in</h1>
              <p className="login-sub">
                You were sent to this page to sign in to your workspace.
                {workspaceSlugDisplay ? (
                  <>
                    {' '}
                    <span className="login-workspace-slug">/employee/{workspaceSlugDisplay}</span>
                  </>
                ) : null}
              </p>
            </>
          ) : (
            <>
              <h1>24Digi CRM</h1>
              <p>Sign in to access your dashboard</p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isEmployeeWorkspaceLogin ? 'you@company.com' : 'admin@24digi.com'}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {!isEmployeeWorkspaceLogin ? (
          <p className="login-hint">
            Default: {DEFAULT_EMAIL} / {DEFAULT_PASSWORD}
          </p>
        ) : (
          <p className="login-hint login-hint--muted">
            Use the email and password for your staff account.
          </p>
        )}
      </div>
    </div>
  );
}
