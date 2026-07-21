/* =========================================================
   ADMIN PANEL LOGIC — wired to the real backend API
   ========================================================= */
let currentToken = null;
let searchDebounceTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentToken = getAdminToken();
  if (!currentToken) {
    window.location.href = 'admin-login.html';
    return;
  }

  initSidebar();

  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(loadParticipants, 300);
  });
  document.getElementById('statusFilter').addEventListener('change', loadParticipants);
  document.getElementById('exportBtn').addEventListener('click', exportCsv);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  await Promise.all([loadStats(), loadParticipants()]);
});

/* =========================================================
   DATA LOADING
   ========================================================= */
async function loadStats() {
  try {
    const stats = await apiFetch('/admin/stats', { token: currentToken });
    document.getElementById('statTotalUsers').textContent = stats.totalUsers;
    document.getElementById('statGenerated').textContent = stats.generated;
    document.getElementById('statSent').textContent = stats.sent;
    document.getElementById('statPending').textContent = stats.pending;
  } catch (err) {
    handleAuthError(err);
  }
}

function currentQuery() {
  const search = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('statusFilter').value;
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  return params.toString();
}

async function loadParticipants() {
  try {
    const query = currentQuery();
    const data = await apiFetch(`/admin/participants${query ? `?${query}` : ''}`, { token: currentToken });
    renderTable(data.participants);
  } catch (err) {
    handleAuthError(err);
  }
}

function handleAuthError(err) {
  if (err.status === 401) {
    clearAdminSession();
    window.location.href = 'admin-login.html';
    return;
  }
  showToast(err.message || 'Something went wrong.', 'error');
}

/* =========================================================
   RENDER TABLE
   ========================================================= */
function renderTable(rows) {
  const tbody = document.getElementById('usersTableBody');
  const emptyMsg = document.getElementById('tableEmpty');

  tbody.innerHTML = '';
  emptyMsg.hidden = rows.length > 0;

  rows.forEach(p => tbody.appendChild(buildRow(p)));
}

function buildRow(p) {
  const tr = document.createElement('tr');
  tr.dataset.id = p.id;

  const initials = p.fullName.trim().charAt(0).toUpperCase();
  const registeredLabel = new Date(p.registeredAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const { chipClass, chipLabel } = statusChip(p.certificateStatus);
  const canResend = p.certificateStatus && p.certificateStatus !== 'not_generated';

  tr.innerHTML = `
    <td>
      <div class="participant-cell">
        <span class="participant-avatar">${initials}</span>
        <span class="participant-name">${escapeHtml(p.fullName)}</span>
      </div>
    </td>
    <td>${escapeHtml(p.email)}</td>
    <td>${registeredLabel}</td>
    <td><span class="chip ${chipClass}">${chipLabel}</span></td>
    <td class="actions-cell">
      <div class="row-actions">
        <button class="icon-btn" data-action="resend" title="Resend certificate" ${canResend ? '' : 'disabled'}>
          <i class="fa-solid fa-paper-plane"></i>
        </button>
        <button class="icon-btn" data-action="unlock" title="Allow regeneration" ${canResend && !p.regenerationAllowed ? '' : 'disabled'}>
          <i class="fa-solid fa-lock-open"></i>
        </button>
        <button class="icon-btn icon-btn--danger" data-action="delete" title="Delete user">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </td>
  `;

  tr.querySelector('[data-action="resend"]')?.addEventListener('click', (e) => handleResend(e, p.id, p.email));
  tr.querySelector('[data-action="unlock"]')?.addEventListener('click', (e) => handleAllowRegeneration(e, p.id, p.fullName));
  tr.querySelector('[data-action="delete"]').addEventListener('click', () => handleDelete(p.id, p.fullName));

  return tr;
}

function statusChip(status) {
  if (status === 'email_sent' || status === 'generated') return { chipClass: 'chip--success', chipLabel: 'Generated' };
  if (status === 'email_pending') return { chipClass: 'chip--gold', chipLabel: 'Pending Email' };
  if (status === 'email_failed') return { chipClass: '', chipLabel: 'Email Failed' };
  return { chipClass: '', chipLabel: 'Not Generated' };
}

/* =========================================================
   ACTIONS
   ========================================================= */
async function handleResend(e, id, email) {
  const btn = e.currentTarget;
  btn.disabled = true;
  btn.classList.add('is-spinning');

  try {
    await apiFetch(`/admin/participants/${id}/resend-certificate`, { method: 'POST', token: currentToken });
    showToast(`Certificate resent to ${email}.`, 'success');
  } catch (err) {
    showToast(err.message || 'Could not resend the certificate.', 'error');
  } finally {
    btn.classList.remove('is-spinning');
    btn.disabled = false;
  }
}

async function handleAllowRegeneration(e, id, name) {
  const btn = e.currentTarget;
  btn.disabled = true;
  btn.classList.add('is-spinning');

  try {
    await apiFetch(`/admin/participants/${id}/allow-regeneration`, { method: 'POST', token: currentToken });
    showToast(`${name} can now regenerate their certificate.`, 'success');
    await loadParticipants();
  } catch (err) {
    showToast(err.message || 'Could not unlock regeneration for this user.', 'error');
    btn.classList.remove('is-spinning');
    btn.disabled = false;
  }
}

async function handleDelete(id, name) {
  const confirmed = window.confirm(`Delete ${name}? This cannot be undone.`);
  if (!confirmed) return;

  try {
    await apiFetch(`/admin/participants/${id}`, { method: 'DELETE', token: currentToken });
    showToast(`${name} was removed.`, 'success');
    await Promise.all([loadStats(), loadParticipants()]);
  } catch (err) {
    showToast(err.message || 'Could not delete this user.', 'error');
  }
}

async function exportCsv() {
  try {
    const query = currentQuery();
    const filename = `ypsg-participants-${new Date().toISOString().slice(0, 10)}.csv`;
    await downloadFileWithAuth(`/admin/participants/export${query ? `?${query}` : ''}`, currentToken, filename);
    showToast('Participant list exported.', 'success');
  } catch (err) {
    showToast(err.message || 'Could not export the participant list.', 'error');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* =========================================================
   SIDEBAR (mobile)
   ========================================================= */
function initSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const openBtn = document.getElementById('sidebarOpen');
  const closeBtn = document.getElementById('sidebarClose');

  const open = () => { sidebar.classList.add('is-open'); backdrop.classList.add('is-open'); };
  const close = () => { sidebar.classList.remove('is-open'); backdrop.classList.remove('is-open'); };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  document.querySelectorAll('.admin-nav__link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav__link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.getElementById('pageTitle').textContent = link.dataset.nav === 'users' ? 'Participants' : 'Overview';
      close();
    });
  });
}

/* =========================================================
   LOGOUT
   ========================================================= */
function handleLogout() {
  clearAdminSession();
  window.location.href = 'admin-login.html';
}
