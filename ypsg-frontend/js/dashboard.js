/* =========================================================
   DASHBOARD LOGIC — wired to the real backend API
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
  const token = getUserToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  let user, certificate;
  try {
    const data = await apiFetch('/auth/me', { token });
    user = data.user;
    certificate = data.certificate;
  } catch (err) {
    // Expired/invalid token — send them back to log in again.
    clearUserSession();
    window.location.href = 'login.html';
    return;
  }

  renderUser(user);
  renderCertificateState(certificate, user);

  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('certForm').addEventListener('submit', (e) => handleGenerate(e, user, token));

  document.getElementById('certPreviewThumb')?.addEventListener('click', openModal);
  document.getElementById('viewCertBtn')?.addEventListener('click', openModal);
  document.getElementById('downloadBtn')?.addEventListener('click', () => handleDownload(token));
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', closeModal);
  document.getElementById('modalDownloadBtn').addEventListener('click', () => handleDownload(token));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
});

/* =========================================================
   RENDER USER INFO
   ========================================================= */
function renderUser(user) {
  const initials = user.fullName.trim().charAt(0).toUpperCase() || 'Y';
  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userNameLabel').textContent = user.fullName;
  document.getElementById('userEmailLabel').textContent = user.email;
  document.getElementById('welcomeName').textContent = `Welcome back, ${user.fullName.split(' ')[0]} `;
  document.getElementById('infoName').textContent = user.fullName;
  document.getElementById('infoEmail').textContent = user.email;

  // Pre-fill the certificate name field with the account name by default.
  const certNameInput = document.getElementById('certName');
  if (certNameInput && !certNameInput.value) certNameInput.value = user.fullName;
}

/* =========================================================
   CERTIFICATE STATE
   ========================================================= */
function renderCertificateState(certificate, user) {
  const chip = document.getElementById('certStatusChip');

  if (certificate) {
    chip.textContent = certificateStatusLabel(certificate.status);
    chip.className = `chip ${certificate.status === 'email_failed' ? '' : 'chip--success'}`;
    document.getElementById('certNameValue').textContent = certificate.name;
    document.getElementById('certEmailValue').textContent = user.email;
    showDoneState(certificate.name, user.email);
  } else {
    chip.textContent = 'Not Generated';
    chip.className = 'chip';
    document.getElementById('certNameValue').textContent = '—';
    document.getElementById('certEmailValue').textContent = '—';
  }
}

function certificateStatusLabel(status) {
  switch (status) {
    case 'email_sent': return 'Generated & Emailed';
    case 'email_pending': return 'Generating…';
    case 'email_failed': return 'Generated (Email Failed)';
    default: return 'Generated';
  }
}

async function handleGenerate(e, user, token) {
  e.preventDefault();

  const nameInput = document.getElementById('certName');
  const confirmCheckbox = document.getElementById('certConfirm');
  const name = nameInput.value.trim();

  if (!name || name.length < 3) {
    setFieldError('certName', 'certNameError', 'Please enter the full name for your certificate.');
    return;
  }
  setFieldError('certName', 'certNameError', '');

  if (!confirmCheckbox.checked) {
    showToast('Please confirm you understand this name cannot be edited.', 'error');
    return;
  }

  const reallySure = window.confirm(
    `Generate your certificate for "${name}"?\n\nThis name cannot be changed afterwards.`
  );
  if (!reallySure) return;

  // Kick off the progress animation and the real request together — the
  // animation is purely visual and resolves independently of the network call.
  const progressPromise = runGenerationSequence();

  let certificate;
  try {
    const [, data] = await Promise.all([
      progressPromise,
      apiFetch('/certificates/generate', { method: 'POST', token, body: { certificateName: name } })
    ]);
    certificate = data.certificate;
  } catch (err) {
    document.getElementById('certProgressState').hidden = true;
    document.getElementById('certFormState').hidden = false;
    showToast(err.message || 'Could not generate your certificate. Please try again.', 'error');
    return;
  }

  document.getElementById('certStatusChip').textContent = certificateStatusLabel(certificate.status);
  document.getElementById('certStatusChip').className = `chip ${certificate.status === 'email_failed' ? '' : 'chip--success'}`;
  document.getElementById('certNameValue').textContent = certificate.name;
  document.getElementById('certEmailValue').textContent = user.email;

  showDoneState(certificate.name, user.email);

  if (certificate.status === 'email_failed') {
    showToast('Certificate generated, but the email could not be sent. You can still download it below.', 'error');
  } else {
    showToast('Certificate generated and emailed successfully!', 'success');
  }
}

/* Animate the progress bar through a few realistic stages (visual only) */
function runGenerationSequence() {
  return new Promise((resolve) => {
    document.getElementById('certFormState').hidden = true;
    document.getElementById('certProgressState').hidden = false;

    const fill = document.getElementById('progressFill');
    const label = document.getElementById('progressLabel');
    const stages = [
      { pct: 20, text: 'Preparing certificate template…' },
      { pct: 50, text: 'Inserting your name…' },
      { pct: 78, text: 'Rendering PDF…' },
      { pct: 100, text: 'Sending certificate to your email…' }
    ];

    let i = 0;
    const step = () => {
      const stage = stages[i];
      fill.style.width = `${stage.pct}%`;
      label.textContent = stage.text;
      i++;
      if (i < stages.length) {
        setTimeout(step, 550);
      } else {
        setTimeout(resolve, 400);
      }
    };
    step();
  });
}

function showDoneState(name, email) {
  document.getElementById('certFormState').hidden = true;
  document.getElementById('certProgressState').hidden = true;
  document.getElementById('certDoneState').hidden = false;

  document.getElementById('certPreviewName').textContent = name;
  document.getElementById('certDoneEmail').textContent = email;
  document.getElementById('certificateName').textContent = name;
}

async function handleDownload(token) {
  try {
    await downloadFileWithAuth('/certificates/download', token, 'YPSG-Certificate.pdf');
  } catch (err) {
    showToast(err.message || 'Could not download your certificate.', 'error');
  }
}

/* =========================================================
   CERTIFICATE PREVIEW MODAL
   ========================================================= */
function openModal() {
  document.getElementById('certModal').classList.add('is-open');
  document.getElementById('certModal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('certModal').classList.remove('is-open');
  document.getElementById('certModal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* =========================================================
   LOGOUT
   ========================================================= */
function handleLogout() {
  clearUserSession();
  window.location.href = 'login.html';
}
