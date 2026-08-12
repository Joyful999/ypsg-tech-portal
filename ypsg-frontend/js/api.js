/* =========================================================
   SHARED API CLIENT
   ---------------------------------------------------------
   Loaded before auth-common.js on every page that talks to the
   backend (register, login, dashboard, admin-login, admin).
   Update API_BASE_URL to match wherever the Express server is
   actually running/deployed.
   ========================================================= */
const API_BASE_URL = 'https://ypsg-tech-portal-production.up.railway.app/api';
/**
 * Wraps fetch() with JSON handling, auth headers, and a consistent
 * error shape. Throws an Error with:
 *   .status      — HTTP status code (0 for a network failure)
 *   .fieldErrors — [{ field, message }] when the API returned
 *                  express-validator style validation errors
 */
async function apiFetch(path, { method = 'GET', body, token, isForm = false } = {}) {
  const headers = {};
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : (isForm ? body : JSON.stringify(body))
    });
  } catch (networkErr) {
    const err = new Error('Could not reach the server. Please check your connection and try again.');
    err.status = 0;
    throw err;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const message = (data && data.message) || `Request failed (${response.status}).`;
    const err = new Error(message);
    err.status = response.status;
    err.fieldErrors = data && data.errors;
    throw err;
  }

  return data;
}

/**
 * Fetches a binary file (e.g. a certificate PDF or CSV export) with an
 * auth header, since a plain <a href> can't attach one, and triggers a
 * browser download of the response under the given filename.
 */
async function downloadFileWithAuth(path, token, filename) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const err = new Error((data && data.message) || 'Download failed.');
    err.status = response.status;
    throw err;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ---------- Participant session (sessionStorage: cleared when the tab closes) ---------- */
const USER_TOKEN_KEY = 'ypsg_token';
const USER_DATA_KEY = 'ypsg_user';

function getUserToken() { return sessionStorage.getItem(USER_TOKEN_KEY); }
function getUserData() {
  const raw = sessionStorage.getItem(USER_DATA_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setUserSession(token, user) {
  sessionStorage.setItem(USER_TOKEN_KEY, token);
  sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}
function clearUserSession() {
  sessionStorage.removeItem(USER_TOKEN_KEY);
  sessionStorage.removeItem(USER_DATA_KEY);
}

/* ---------- Admin session (kept entirely separate from the participant session) ---------- */
const ADMIN_TOKEN_KEY = 'ypsg_admin_token';
const ADMIN_DATA_KEY = 'ypsg_admin';

function getAdminToken() { return sessionStorage.getItem(ADMIN_TOKEN_KEY); }
function getAdminData() {
  const raw = sessionStorage.getItem(ADMIN_DATA_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setAdminSession(token, admin) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  sessionStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(admin));
}
function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_DATA_KEY);
}
