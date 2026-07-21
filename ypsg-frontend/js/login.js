/* =========================================================
   LOGIN PAGE LOGIC
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('loginBtn');
  const forgotBtn = document.getElementById('forgotPasswordBtn');

  restoreRememberedEmail();

  form.addEventListener('submit', handleSubmit);
  forgotBtn.addEventListener('click', handleForgotPassword);

  async function handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    const isValid = validateForm({ email, password });
    if (!isValid) return;

    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      setUserSession(data.token, data.user);

      if (rememberMe) {
        localStorage.setItem('ypsg_remembered_email', email);
      } else {
        localStorage.removeItem('ypsg_remembered_email');
      }

      showToast('Logged in successfully. Redirecting…', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);

    } catch (err) {
      showToast(err.message || 'Invalid email or password.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    // Placeholder flow — a real "forgot password" endpoint/page can replace this toast.
    showToast('Password reset isn\u2019t available yet — please contact info@ypsgtechportal.org.', 'error', 4200);
  }

  function setLoading(isLoading) {
    submitBtn.classList.toggle('is-loading', isLoading);
    submitBtn.disabled = isLoading;
    submitBtn.querySelector('.btn-label').textContent = isLoading ? 'Logging In…' : 'Log In';
  }

  function validateForm({ email, password }) {
    let valid = true;

    if (!email) {
      setFieldError('email', 'emailError', 'Please enter your email address.');
      valid = false;
    } else if (!isValidEmail(email)) {
      setFieldError('email', 'emailError', 'Please enter a valid email address.');
      valid = false;
    } else {
      setFieldError('email', 'emailError', '');
    }

    if (!password) {
      setFieldError('password', 'passwordError', 'Please enter your password.');
      valid = false;
    } else {
      setFieldError('password', 'passwordError', '');
    }

    return valid;
  }

  /* Pre-fill the email field if "Remember me" was checked on a previous visit */
  function restoreRememberedEmail() {
    const remembered = localStorage.getItem('ypsg_remembered_email');
    if (remembered) {
      document.getElementById('email').value = remembered;
      document.getElementById('rememberMe').checked = true;
    }
  }
});
