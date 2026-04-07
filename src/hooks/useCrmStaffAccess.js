import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CRM_EMPLOYEES_COLLECTION, crmStaffHasFullAccess } from '../constants';
import { useAuth } from '../context/AuthContext';

/**
 * Resolves which CRM sidebar modules a signed-in user may access on /dashboard.
 * - No `crm_employees` doc: full access (owner / legacy).
 * - `staff_admin` + crmAllowedModules ['*'] or missing: full access.
 * - `staff_admin` + list of keys: restricted.
 * - `employee`: should not use admin dashboard; treated as dashboard-only.
 */
export function useCrmStaffAccess() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasFullAccess, setHasFullAccess] = useState(true);
  const [allowedKeys, setAllowedKeys] = useState(() => new Set());
  const [staffRole, setStaffRole] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setHasFullAccess(true);
      setAllowedKeys(new Set());
      setStaffRole(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, CRM_EMPLOYEES_COLLECTION, user.uid));
        if (cancelled) return;
        if (!snap.exists()) {
          setHasFullAccess(true);
          setAllowedKeys(new Set());
          setStaffRole(null);
          return;
        }
        const d = snap.data() || {};
        const role = String(d.role || '').toLowerCase();
        setStaffRole(role);
        if (role === 'employee') {
          setHasFullAccess(false);
          setAllowedKeys(new Set(['dashboard']));
          return;
        }
        if (crmStaffHasFullAccess(d.crmAllowedModules)) {
          setHasFullAccess(true);
          setAllowedKeys(new Set());
          return;
        }
        const list = Array.isArray(d.crmAllowedModules) ? d.crmAllowedModules : [];
        setHasFullAccess(false);
        const s = new Set(list);
        if (s.size === 0) s.add('dashboard');
        setAllowedKeys(s);
      } catch {
        if (!cancelled) {
          setHasFullAccess(true);
          setAllowedKeys(new Set());
          setStaffRole(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const canSee = useCallback(
    (moduleKey) => {
      if (!moduleKey) return true;
      if (hasFullAccess) return true;
      return allowedKeys.has(moduleKey);
    },
    [hasFullAccess, allowedKeys],
  );

  return {
    loading,
    hasFullAccess,
    allowedKeys,
    staffRole,
    canSee,
  };
}
