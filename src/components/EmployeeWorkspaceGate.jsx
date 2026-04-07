import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  CRM_EMPLOYEES_COLLECTION,
  ROUTES,
  employeePortalPath,
} from '../constants';
import { useAuth } from '../context/AuthContext';

/**
 * Only active crm_employees with role "employee" and matching portalSlug may use /employee/:slug.
 * Admins and other roles are sent to the main dashboard so the employee shell never shows owner accounts.
 */
export default function EmployeeWorkspaceGate({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { slug: slugFromRoute } = useParams();
  const [verdict, setVerdict] = useState({
    phase: 'loading',
    redirectTo: null,
  });

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    const urlSlugRaw = String(slugFromRoute || '').trim();

    (async () => {
      try {
        const snap = await getDoc(doc(db, CRM_EMPLOYEES_COLLECTION, user.uid));
        if (cancelled) return;

        if (!snap.exists()) {
          setVerdict({ phase: 'deny', redirectTo: ROUTES.DASHBOARD });
          return;
        }

        const row = snap.data() || {};
        if (row.active === false) {
          setVerdict({ phase: 'deny', redirectTo: ROUTES.DASHBOARD });
          return;
        }

        const role = String(row.role || '').toLowerCase();
        if (role !== 'employee') {
          setVerdict({ phase: 'deny', redirectTo: ROUTES.DASHBOARD });
          return;
        }

        let urlSlugDecoded = urlSlugRaw;
        try {
          urlSlugDecoded = decodeURIComponent(urlSlugRaw);
        } catch {
          // keep raw
        }

        const portalSlug = String(row.portalSlug || '').trim();
        if (!portalSlug) {
          setVerdict({ phase: 'deny', redirectTo: ROUTES.DASHBOARD });
          return;
        }

        const match =
          portalSlug.toLowerCase() === String(urlSlugDecoded).toLowerCase();

        if (match) {
          setVerdict({ phase: 'allow', redirectTo: null });
          return;
        }

        setVerdict({
          phase: 'wrongSlug',
          redirectTo: employeePortalPath(portalSlug),
        });
      } catch {
        if (!cancelled) {
          setVerdict({ phase: 'deny', redirectTo: ROUTES.DASHBOARD });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, slugFromRoute]);

  if (authLoading || verdict.phase === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading workspace…</p>
      </div>
    );
  }

  if (verdict.phase === 'wrongSlug' && verdict.redirectTo) {
    return <Navigate to={verdict.redirectTo} replace />;
  }

  if (verdict.phase === 'deny' && verdict.redirectTo) {
    return <Navigate to={verdict.redirectTo} replace />;
  }

  if (verdict.phase === 'allow') {
    return children;
  }

  return <Navigate to={ROUTES.DASHBOARD} replace />;
}
