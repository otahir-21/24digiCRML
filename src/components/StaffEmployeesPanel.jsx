import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteField,
  serverTimestamp,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { auth, db, getSecondaryAuth } from '../firebase/config';
import {
  CRM_EMPLOYEES_COLLECTION,
  CRM_ACCESS_MODULES,
  CRM_ACCESS_MODULE_ALL,
  buildCrmAllowedModulesForSave,
  crmStaffHasFullAccess,
  employeePortalPath,
  ROUTES,
} from '../constants';
import { useAuth } from '../context/AuthContext';
import { useCrmStaffAccess } from '../hooks/useCrmStaffAccess';
import './StaffEmployeesPanel.css';

/** Strong throwaway password if admin leaves password blank (employee sets real password via email link). */
function generateTemporaryPassword() {
  const buf = new Uint8Array(18);
  crypto.getRandomValues(buf);
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  return `Tmp_${hex}Aa1`;
}

/**
 * Firebase only allows continueUrl origins listed under Authentication → Settings → Authorized domains.
 * New projects include `localhost` but often NOT `127.0.0.1`, which causes auth/unauthorized-continue-uri.
 */
function normalizeOriginForFirebaseAuth(origin) {
  const trimmed = String(origin || '').trim().replace(/\/$/, '');
  if (!trimmed) return '';
  try {
    const u = new URL(trimmed);
    if (u.hostname === '127.0.0.1') {
      u.hostname = 'localhost';
    }
    return u.origin;
  } catch {
    return trimmed;
  }
}

function getPublicOrigin() {
  const fromEnv = import.meta.env.VITE_PUBLIC_APP_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return normalizeOriginForFirebaseAuth(String(fromEnv).trim());
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeOriginForFirebaseAuth(window.location.origin);
  }
  return '';
}

function formatUnauthorizedContinueUriHelp(continueUrl) {
  return (
    `The redirect URL is not allowlisted in Firebase: ${continueUrl}. `
    + 'Fix: Firebase Console → Authentication → Settings → Authorized domains → Add domain '
    + '(e.g. localhost, or your production host). '
    + 'If you use 127.0.0.1 in the browser, either open http://localhost:5173 instead or add 127.0.0.1 as an authorized domain.'
  );
}

async function touchEmployeeInviteTimestamp(lowerEmail) {
  const q = query(
    collection(db, CRM_EMPLOYEES_COLLECTION),
    where('email', '==', lowerEmail),
    limit(1),
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(doc(db, CRM_EMPLOYEES_COLLECTION, snap.docs[0].id), {
      lastInviteSentAt: serverTimestamp(),
    });
  }
}

/**
 * @param portalSlug - optional; continueUrl is /employee/<slug> so after password reset users land on their workspace URL
 * (unauthenticated users are sent to /login?next=/employee/… to sign in).
 */
async function sendEmployeeSetupEmail(emailAddress, portalSlug = '') {
  const origin = getPublicOrigin();
  if (!origin) {
    throw new Error(
      'Set VITE_PUBLIC_APP_URL to your deployed CRM URL (or open this app in a browser so links use the current origin).',
    );
  }
  const slug = String(portalSlug || '').trim();
  const continueUrl = slug
    ? `${origin}${employeePortalPath(slug)}`
    : `${origin}${ROUTES.LOGIN}`;
  try {
    await sendPasswordResetEmail(auth, emailAddress, {
      url: continueUrl,
      handleCodeInApp: false,
    });
  } catch (e) {
    if (e?.code === 'auth/unauthorized-continue-uri') {
      throw new Error(formatUnauthorizedContinueUriHelp(continueUrl));
    }
    throw e;
  }
}

function slugify(name) {
  return (
    String(name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'employee'
  );
}

function authErrorMessage(code) {
  const map = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/operation-not-allowed': 'Email/password sign-in is disabled for this project (Firebase Console).',
  };
  return map[code] || 'Could not create account. Check Firebase Auth and try again.';
}

function StaffSuccessNotice({ info }) {
  if (!info) return null;
  const title =
    info.type === 'employee_created' ? 'Employee account created' : 'Setup email sent';
  const footInvite =
    'After they set a password, Firebase sends them to their workspace URL. If they are not signed in yet, they will sign in on a workspace login screen and then return to the same URL. Ask them to check inbox, spam, and Gmail Promotions if needed.';
  const footCreatedOk =
    'A password setup message was sent through Firebase. After they set a password, they can sign in; their workspace link is shown above.';
  const footCreatedNoEmail =
    'No setup email was sent for this account. Share the initial password through a secure channel, or enable “Send setup email” and save again / use Resend in the directory.';
  const footCreatedMailErr = (msg) =>
    `The account was saved, but Firebase could not send the setup email (${msg}). Use “Send setup email” in the directory or below.`;

  return (
    <div className="sep-notice" role="status" aria-live="polite">
      <div className="sep-notice-icon" aria-hidden="true">
        ✓
      </div>
      <div className="sep-notice-body">
        <h3 className="sep-notice-title">{title}</h3>
        <dl className="sep-notice-dl">
          <dt>Recipient</dt>
          <dd>{info.email}</dd>
          <dt>Workspace URL</dt>
          <dd>
            <a
              href={info.workspaceUrl}
              className="sep-notice-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {info.workspaceUrl}
            </a>
          </dd>
        </dl>
        {info.type === 'invite_sent' && <p className="sep-notice-foot">{footInvite}</p>}
        {info.type === 'employee_created' && info.noInviteSent && (
          <p className="sep-notice-foot">{footCreatedNoEmail}</p>
        )}
        {info.type === 'employee_created' && !info.noInviteSent && info.setupEmailWarning && (
          <p className="sep-notice-foot sep-notice-foot--warn">
            {footCreatedMailErr(info.setupEmailWarning)}
          </p>
        )}
        {info.type === 'employee_created' && !info.noInviteSent && info.setupEmailSent && (
          <p className="sep-notice-foot">{footCreatedOk}</p>
        )}
      </div>
    </div>
  );
}

export default function StaffEmployeesPanel({ initialTab = 'create' }) {
  const { user: adminUser } = useAuth();
  const { hasFullAccess: editorHasFullCrmAccess } = useCrmStaffAccess();
  const allModuleKeys = useMemo(() => CRM_ACCESS_MODULES.map((m) => m.key), []);

  const [tab, setTab] = useState(initialTab);
  const [rows, setRows] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [portalSlug, setPortalSlug] = useState('');
  const [role, setRole] = useState('employee');
  const [portalSlugTouched, setPortalSlugTouched] = useState(false);
  const [sendSetupEmail, setSendSetupEmail] = useState(true);
  const [resendingForEmail, setResendingForEmail] = useState(null);
  const [duplicateEmailHelp, setDuplicateEmailHelp] = useState(false);
  const [loadingSetupOnly, setLoadingSetupOnly] = useState(false);

  const [staffCrmFullAccess, setStaffCrmFullAccess] = useState(true);
  const [staffCrmSelected, setStaffCrmSelected] = useState(
    () => new Set(CRM_ACCESS_MODULES.map((m) => m.key)),
  );

  const [accessModalRow, setAccessModalRow] = useState(null);
  const [accessModalFull, setAccessModalFull] = useState(true);
  const [accessModalSelected, setAccessModalSelected] = useState(() => new Set());
  const [accessModalSaving, setAccessModalSaving] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setError('');
    try {
      const snap = await getDocs(collection(db, CRM_EMPLOYEES_COLLECTION));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')));
      setRows(list);
    } catch (e) {
      setError(e.message || 'Failed to load employees. Check Firestore rules for crm_employees.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== 'list') return;
    loadList();
  }, [tab, loadList]);

  const onFullNameChange = (v) => {
    setFullName(v);
    if (!portalSlugTouched) {
      setPortalSlug(slugify(v));
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPortalSlug('');
    setRole('employee');
    setPortalSlugTouched(false);
    setSendSetupEmail(true);
    setStaffCrmFullAccess(true);
    setStaffCrmSelected(new Set(CRM_ACCESS_MODULES.map((m) => m.key)));
  };

  const openCrmAccessModal = (row) => {
    if (String(row?.role || '').toLowerCase() !== 'staff_admin') return;
    const full = crmStaffHasFullAccess(row.crmAllowedModules);
    setAccessModalRow(row);
    setAccessModalFull(full);
    if (full) {
      setAccessModalSelected(new Set(allModuleKeys));
    } else {
      const raw = Array.isArray(row.crmAllowedModules) ? row.crmAllowedModules : [];
      const s = new Set(raw.filter((k) => allModuleKeys.includes(k)));
      if (!s.has('dashboard')) s.add('dashboard');
      setAccessModalSelected(s);
    }
  };

  const saveCrmAccessModal = async () => {
    if (!accessModalRow?.id) return;
    setAccessModalSaving(true);
    setError('');
    try {
      const modules = buildCrmAllowedModulesForSave([...accessModalSelected], accessModalFull);
      await updateDoc(doc(db, CRM_EMPLOYEES_COLLECTION, accessModalRow.id), {
        crmAllowedModules: modules,
        crmAccessUpdatedAt: serverTimestamp(),
        crmAccessUpdatedBy: adminUser?.email || null,
      });
      setAccessModalRow(null);
      loadList();
    } catch (e) {
      setError(e.message || 'Could not save CRM access.');
    } finally {
      setAccessModalSaving(false);
    }
  };

  const toggleStaffCrmKey = (key, inForm) => {
    if (key === 'dashboard') return;
    if (inForm) {
      setStaffCrmFullAccess(false);
      setStaffCrmSelected((prev) => {
        const n = new Set(prev);
        if (n.has(key)) n.delete(key);
        else n.add(key);
        if (!n.has('dashboard')) n.add('dashboard');
        return n;
      });
    } else {
      setAccessModalFull(false);
      setAccessModalSelected((prev) => {
        const n = new Set(prev);
        if (n.has(key)) n.delete(key);
        else n.add(key);
        if (!n.has('dashboard')) n.add('dashboard');
        return n;
      });
    }
  };

  const handleResendSetup = async (row) => {
    const em = row?.email;
    if (!em) return;
    setResendingForEmail(em);
    setError('');
    setSuccessInfo(null);
    try {
      const slugRow = row.portalSlug || slugify(row.fullName || em.split('@')[0] || 'employee');
      await sendEmployeeSetupEmail(em, slugRow);
      await touchEmployeeInviteTimestamp(String(em).toLowerCase().trim());
      const portalAbs = `${getPublicOrigin()}${employeePortalPath(slugRow)}`;
      setSuccessInfo({ type: 'invite_sent', email: em, workspaceUrl: portalAbs });
      loadList();
    } catch (err) {
      setError(err.message || 'Could not send email. Check Firebase Auth templates and domain allowlist.');
    } finally {
      setResendingForEmail(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);
    if (!email.trim() || !fullName.trim()) {
      setError('Email and full name are required.');
      return;
    }
    const effectivePassword = password.trim() ? password : generateTemporaryPassword();
    if (effectivePassword.length < 6) {
      setError('Password must be at least 6 characters (or leave blank to email a setup link only).');
      return;
    }

    const slug = (portalSlug.trim() ? slugify(portalSlug) : slugify(fullName)) || slugify(email.split('@')[0]);

    const secondaryAuth = getSecondaryAuth();
    setLoadingSubmit(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email.trim(),
        effectivePassword,
      );
      await updateProfile(cred.user, { displayName: fullName.trim() });

      try {
        const crmMods =
          role === 'staff_admin'
            ? editorHasFullCrmAccess
              ? buildCrmAllowedModulesForSave([...staffCrmSelected], staffCrmFullAccess)
              : [CRM_ACCESS_MODULE_ALL]
            : null;

        await setDoc(doc(db, CRM_EMPLOYEES_COLLECTION, cred.user.uid), {
          uid: cred.user.uid,
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          portalSlug: slug,
          role,
          active: true,
          createdAt: serverTimestamp(),
          createdByUid: adminUser?.uid || null,
          createdByEmail: adminUser?.email || null,
          onboardingViaEmail: sendSetupEmail,
          ...(role === 'staff_admin' ? { crmAllowedModules: crmMods } : { crmAllowedModules: deleteField() }),
        });
      } catch (fsErr) {
        try {
          await cred.user.delete();
        } catch (delErr) {
          // eslint-disable-next-line no-console
          console.error(delErr);
        }
        throw fsErr;
      }

      let setupEmailSent = false;
      let setupEmailWarning = null;
      if (sendSetupEmail) {
        try {
          await sendEmployeeSetupEmail(email.trim(), slug);
          await updateDoc(doc(db, CRM_EMPLOYEES_COLLECTION, cred.user.uid), {
            lastInviteSentAt: serverTimestamp(),
          });
          setupEmailSent = true;
        } catch (mailErr) {
          setupEmailWarning = mailErr.message || 'unknown error';
        }
      }

      const portalAbs = `${getPublicOrigin()}${employeePortalPath(slug)}`;
      setSuccessInfo({
        type: 'employee_created',
        email: email.trim(),
        workspaceUrl: portalAbs,
        noInviteSent: !sendSetupEmail,
        setupEmailSent: sendSetupEmail && setupEmailSent,
        setupEmailWarning: sendSetupEmail ? setupEmailWarning : null,
      });
      resetForm();
      setDuplicateEmailHelp(false);
      loadList();
    } catch (err) {
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        setDuplicateEmailHelp(true);
        setError(
          'This email is already registered in Firebase Auth. The user was created in an earlier attempt — you cannot sign them up twice. Use the button below to resend the password-setup email, or open the Directory tab and use “Resend setup email”.',
        );
      } else {
        setDuplicateEmailHelp(false);
        setError(authErrorMessage(code) || err.message || 'Create failed');
      }
    } finally {
      await signOut(secondaryAuth);
      setLoadingSubmit(false);
    }
  };

  const handleSendSetupLinkOnly = async () => {
    const em = email.trim();
    if (!em) return;
    setLoadingSetupOnly(true);
    setError('');
    setSuccessInfo(null);
    try {
      const slugForEmail =
        (portalSlug.trim() ? slugify(portalSlug) : '') ||
        slugify(fullName || em.split('@')[0] || 'employee');
      await sendEmployeeSetupEmail(em, slugForEmail);
      await touchEmployeeInviteTimestamp(em.toLowerCase());
      const portalAbs = `${getPublicOrigin()}${employeePortalPath(slugForEmail)}`;
      setSuccessInfo({ type: 'invite_sent', email: em, workspaceUrl: portalAbs });
      setDuplicateEmailHelp(false);
    } catch (err) {
      setError(err.message || 'Could not send email.');
    } finally {
      setLoadingSetupOnly(false);
    }
  };

  return (
    <div className="sep-root">
      <div className="sep-tabs">
        <button
          type="button"
          className={tab === 'create' ? 'sep-tab active' : 'sep-tab'}
          onClick={() => setTab('create')}
        >
          Create employee
        </button>
        <button
          type="button"
          className={tab === 'list' ? 'sep-tab active' : 'sep-tab'}
          onClick={() => setTab('list')}
        >
          Directory
        </button>
      </div>

      {error && <div className="sep-error">{error}</div>}
      {duplicateEmailHelp && email.trim() && (
        <div className="sep-action-box">
          <p className="sep-action-title">Resend password link (no new account)</p>
          <p className="sep-action-text">
            Sends the same Firebase setup/reset email to <strong>{email.trim()}</strong> if the address exists.
          </p>
          <button
            type="button"
            className="sep-submit"
            disabled={loadingSetupOnly}
            onClick={handleSendSetupLinkOnly}
          >
            {loadingSetupOnly ? 'Sending…' : 'Send setup email to this address'}
          </button>
        </div>
      )}
      <StaffSuccessNotice info={successInfo} />

      {tab === 'create' && (
        <div className="sep-card">
          <h3 className="sep-h3">New employee or staff account</h3>
          <form className="sep-form" onSubmit={handleCreate}>
            <label className="sep-label">
              Full name
              <input
                className="sep-input"
                value={fullName}
                onChange={(e) => onFullNameChange(e.target.value)}
                placeholder="e.g. Osama Tahir"
                autoComplete="name"
              />
            </label>
            <label className="sep-label">
              Email (login)
              <input
                className="sep-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setDuplicateEmailHelp(false);
                }}
                placeholder="employee@company.com"
                autoComplete="off"
              />
            </label>
            <label className="sep-label">
              Initial password (optional)
              <input
                className="sep-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank if sending setup email only"
                autoComplete="new-password"
              />
              <span className="sep-hint">
                If blank, a random temporary password is used once; the employee never needs it if they complete the
                email link.
              </span>
            </label>
            <label className="sep-check">
              <input
                type="checkbox"
                checked={sendSetupEmail}
                onChange={(e) => setSendSetupEmail(e.target.checked)}
              />
              <span>
                Send setup email (password link → after setting password, redirect to{' '}
                <code>{ROUTES.LOGIN}</code>)
              </span>
            </label>
            <label className="sep-label">
              Portal URL slug
              <input
                className="sep-input"
                value={portalSlug}
                onChange={(e) => {
                  setPortalSlugTouched(true);
                  setPortalSlug(e.target.value);
                }}
                placeholder="auto from name"
              />
              <span className="sep-hint">Used for /employee/your-slug. Only letters, numbers, hyphens.</span>
            </label>
            <label className="sep-label">
              Role
              <select
                className="sep-input"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  if (e.target.value === 'staff_admin') {
                    setStaffCrmFullAccess(true);
                    setStaffCrmSelected(new Set(CRM_ACCESS_MODULES.map((m) => m.key)));
                  }
                }}
              >
                <option value="employee">Employee (workspace portal)</option>
                <option value="staff_admin">Staff admin (signs in to this CRM)</option>
              </select>
            </label>

            {role === 'staff_admin' && editorHasFullCrmAccess && (
              <div className="sep-crm-access">
                <p className="sep-crm-access-title">CRM modules for this staff admin</p>
                <p className="sep-crm-access-hint">
                  Choose which sidebar areas they see. <strong>Dashboard</strong> is always on for partial access.
                  Trusted users only for <strong>Staff / employees</strong> — they can create accounts.
                </p>
                <label className="sep-check">
                  <input
                    type="checkbox"
                    checked={staffCrmFullAccess}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setStaffCrmFullAccess(on);
                      if (on) {
                        setStaffCrmSelected(new Set(CRM_ACCESS_MODULES.map((m) => m.key)));
                      }
                    }}
                  />
                  <span>Full CRM (all modules — same as owner)</span>
                </label>
                {!staffCrmFullAccess && (
                  <div className="sep-crm-grid">
                    {CRM_ACCESS_MODULES.map((m) => (
                      <label key={m.key} className="sep-crm-item">
                        <input
                          type="checkbox"
                          checked={staffCrmSelected.has(m.key)}
                          disabled={m.key === 'dashboard'}
                          onChange={() => toggleStaffCrmKey(m.key, true)}
                        />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {role === 'staff_admin' && !editorHasFullCrmAccess && (
              <p className="sep-hint sep-hint--crm">
                You have limited CRM access: new staff admins are created with <strong>full CRM</strong>. Ask an owner
                to narrow their modules in Directory → CRM access.
              </p>
            )}

            <button type="submit" className="sep-submit" disabled={loadingSubmit}>
              {loadingSubmit ? 'Creating…' : 'Create account'}
            </button>
          </form>
          <p className="sep-rules-note">
            <strong>Firestore:</strong> allow owners to write{' '}
            <code>{CRM_EMPLOYEES_COLLECTION}</code>. Example (dev only): authenticated users can read/write this
            collection — tighten to admin UIDs or custom claims before production.
          </p>
        </div>
      )}

      {tab === 'list' && (
        <div className="sep-card">
          <div className="sep-list-head">
            <h3 className="sep-h3">Employee directory</h3>
            <button type="button" className="sep-btn" onClick={loadList}>
              Refresh
            </button>
          </div>
          {loadingList ? (
            <div aria-busy="true" aria-label="Loading employee directory">
              <div className="sep-loading-bar" />
              <p className="sep-loading-caption">Loading employee directory…</p>
            </div>
          ) : rows.length === 0 ? (
            <p className="sep-muted">No rows yet. Create an employee above.</p>
          ) : (
            <div className="sep-table-wrap">
              <table className="sep-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Portal</th>
                    <th>Active</th>
                    <th>Invite</th>
                    {editorHasFullCrmAccess && <th>CRM access</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.fullName || '—'}</td>
                      <td>
                        <code className="sep-mono">{r.email || '—'}</code>
                      </td>
                      <td>{r.role || '—'}</td>
                      <td>
                        {r.portalSlug ? (
                          <a href={employeePortalPath(r.portalSlug)} target="_blank" rel="noopener noreferrer">
                            /employee/{r.portalSlug}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{r.active === false ? 'No' : 'Yes'}</td>
                      <td>
                        <button
                          type="button"
                          className="sep-btn-small"
                          disabled={resendingForEmail === r.email}
                          onClick={() => handleResendSetup(r)}
                        >
                          {resendingForEmail === r.email ? 'Sending…' : 'Resend setup email'}
                        </button>
                      </td>
                      {editorHasFullCrmAccess && (
                        <td>
                          {String(r.role || '').toLowerCase() === 'staff_admin' ? (
                            <button type="button" className="sep-btn-small" onClick={() => openCrmAccessModal(r)}>
                              Edit
                            </button>
                          ) : (
                            <span className="sep-muted">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {accessModalRow && (
        <div className="sep-modal-backdrop" role="presentation" onClick={() => !accessModalSaving && setAccessModalRow(null)}>
          <div className="sep-modal" role="dialog" aria-labelledby="sep-access-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="sep-access-title" className="sep-modal-title">
              CRM access — {accessModalRow.fullName || accessModalRow.email}
            </h3>
            <p className="sep-modal-sub">
              Controls which areas this staff admin sees in the main CRM sidebar. Dashboard stays on for any partial
              list.
            </p>
            <label className="sep-check">
              <input
                type="checkbox"
                checked={accessModalFull}
                onChange={(e) => {
                  const on = e.target.checked;
                  setAccessModalFull(on);
                  if (on) setAccessModalSelected(new Set(allModuleKeys));
                }}
              />
              <span>Full CRM</span>
            </label>
            {!accessModalFull && (
              <div className="sep-crm-grid sep-crm-grid--modal">
                {CRM_ACCESS_MODULES.map((m) => (
                  <label key={m.key} className="sep-crm-item">
                    <input
                      type="checkbox"
                      checked={accessModalSelected.has(m.key)}
                      disabled={m.key === 'dashboard'}
                      onChange={() => toggleStaffCrmKey(m.key, false)}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="sep-modal-actions">
              <button type="button" className="sep-btn-small" disabled={accessModalSaving} onClick={() => setAccessModalRow(null)}>
                Cancel
              </button>
              <button type="button" className="sep-submit" disabled={accessModalSaving} onClick={saveCrmAccessModal}>
                {accessModalSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
