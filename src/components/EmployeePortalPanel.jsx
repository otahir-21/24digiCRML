import { useAuth } from '../context/AuthContext';
import './EmployeePortalPanel.css';

/**
 * Home view for /employee/:slug — scoped workspace for staff (Auth + crm_employees).
 */
export default function EmployeePortalPanel({ slug }) {
  const { user } = useAuth();
  const displaySlug = slug ? decodeURIComponent(slug) : '—';
  const firstName =
    user?.displayName?.trim()?.split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    'there';

  return (
    <div className="epp-root">
      <header className="epp-hero">
        <h1 className="epp-title">Welcome back, {firstName}</h1>
        <p className="epp-subtitle">
          You’re signed in to your 24Digi workspace. Tools and updates for your role will appear here.
        </p>
      </header>

      <section className="epp-card" aria-labelledby="epp-account-heading">
        <h2 id="epp-account-heading" className="epp-h2">
          Your account
        </h2>
        <dl className="epp-dl">
          <dt>Work email</dt>
          <dd>{user?.email ?? '—'}</dd>
          <dt>Workspace</dt>
          <dd>
            <span className="epp-workspace-badge">{displaySlug}</span>
            <span className="epp-workspace-path muted">/employee/{displaySlug}</span>
          </dd>
        </dl>
      </section>

      <details className="epp-details">
        <summary className="epp-details-summary">Technical details</summary>
        <p className="epp-details-hint">
          Share this only if support asks for it (e.g. access troubleshooting).
        </p>
        <dl className="epp-dl epp-dl--compact">
          <dt>User ID</dt>
          <dd>
            <code className="epp-mono">{user?.uid ?? '—'}</code>
          </dd>
        </dl>
      </details>
    </div>
  );
}
