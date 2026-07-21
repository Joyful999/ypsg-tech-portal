/* =========================================================
   ADMIN LOGIN LOGIC
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Already signed in? skip straight to the panel.
  if (getAdminToken()) {
    window.location.href = 'admin.html';
    return;
  }

  const form = document.getElementById('adminLoginForm');
  const submitBtn = document.getElementById('adminLoginBtn');

  form.addEventListener('submit', handleSubmit);

  async function handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!isValidEmail(email)) {
      setFieldError('email', 'emailError', 'Please enter a valid email address.');
      return;
    }
    setFieldError('email', 'emailError', '');

    if (!password) {
      setFieldError('password', 'passwordError', 'Password is required.');
      return;
    }
    setFieldError('password', 'passwordError', '');

    setLoading(true);
    try {
      const data = await apiFetch('/admin/login', { method: 'POST', body: { email, password } });
      setAdminSession(data.token, data.admin);
      showToast('Signed in successfully. Redirecting…', 'success');
      setTimeout(() => { window.location.href = 'admin.html'; }, 900);
    } catch (err) {
      showToast(err.message || 'Invalid email or password.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    submitBtn.classList.toggle('is-loading', isLoading);
    submitBtn.disabled = isLoading;
    submitBtn.querySelector('.btn-label').textContent = isLoading ? 'Signing In…' : 'Sign In';
  }
});
