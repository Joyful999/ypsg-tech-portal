/* =========================================================
   REGISTER PAGE LOGIC
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('registerBtn');

  passwordInput.addEventListener('input', () => updateStrengthMeter(passwordInput.value));

  form.addEventListener('submit', handleSubmit);

  async function handleSubmit(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    const isValid = validateForm({ fullName, email, password, confirmPassword });
    if (!isValid) return;

    setLoading(true);

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: { fullName, email, password, confirmPassword }
      });

      // Per the spec, registration does NOT log the user in automatically —
      // discard the token/session and send them to the login page instead.
      void data;

      showToast('Account created successfully. Redirecting to login…', 'success');
      form.reset();
      resetStrengthMeter();

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1600);

    } catch (err) {
      if (err.status === 409) {
        setFieldError('email', 'emailError', err.message);
      } else if (err.status === 422 && Array.isArray(err.fieldErrors)) {
        err.fieldErrors.forEach(fe => {
          const errorIdMap = { fullName: 'fullNameError', email: 'emailError', password: 'passwordError', confirmPassword: 'confirmPasswordError' };
          if (errorIdMap[fe.field]) setFieldError(fe.field, errorIdMap[fe.field], fe.message);
        });
      }
      showToast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    submitBtn.classList.toggle('is-loading', isLoading);
    submitBtn.disabled = isLoading;
    submitBtn.querySelector('.btn-label').textContent = isLoading ? 'Creating Account…' : 'Create Account';
  }

  /* ---------- Validation ---------- */
  function validateForm({ fullName, email, password, confirmPassword }) {
    let valid = true;

    if (!fullName) {
      setFieldError('fullName', 'fullNameError', 'Please enter your full name.');
      valid = false;
    } else if (fullName.length < 3) {
      setFieldError('fullName', 'fullNameError', 'Name must be at least 3 characters.');
      valid = false;
    } else {
      setFieldError('fullName', 'fullNameError', '');
    }

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
      setFieldError('password', 'passwordError', 'Please create a password.');
      valid = false;
    } else if (password.length < 8) {
      setFieldError('password', 'passwordError', 'Password must be at least 8 characters.');
      valid = false;
    } else {
      setFieldError('password', 'passwordError', '');
    }

    if (!confirmPassword) {
      setFieldError('confirmPassword', 'confirmPasswordError', 'Please confirm your password.');
      valid = false;
    } else if (password !== confirmPassword) {
      setFieldError('confirmPassword', 'confirmPasswordError', 'Passwords do not match.');
      valid = false;
    } else {
      setFieldError('confirmPassword', 'confirmPasswordError', '');
    }

    return valid;
  }

  /* ---------- Password strength meter ---------- */
  function updateStrengthMeter(value) {
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');

    if (!value) {
      resetStrengthMeter();
      return;
    }

    const score = scorePassword(value);
    const levels = [
      { max: 1, width: '20%',  color: 'var(--error)',  text: 'Very weak' },
      { max: 2, width: '40%',  color: '#e08a2c',        text: 'Weak' },
      { max: 3, width: '65%',  color: 'var(--gold)',    text: 'Fair' },
      { max: 4, width: '85%',  color: '#7a9a3f',        text: 'Strong' },
      { max: 6, width: '100%', color: 'var(--success)', text: 'Very strong' }
    ];
    const level = levels.find(l => score <= l.max) || levels[levels.length - 1];

    fill.style.width = level.width;
    fill.style.background = level.color;
    label.textContent = level.text;
  }

  function resetStrengthMeter() {
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    fill.style.width = '0%';
    label.textContent = 'Password strength';
  }

  function scorePassword(value) {
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }
});
