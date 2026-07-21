/* =========================================================
   SHARED AUTH HELPERS — toast notifications & password toggles
   ========================================================= */

/** Show a toast notification. type: 'success' | 'error' */
function showToast(message, type = 'success', duration = 3200) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMessage');
  const icon = toast.querySelector('i');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.toggle('is-error', type === 'error');
  icon.className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';

  toast.classList.add('is-visible');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('is-visible'), duration);
}

/** Wire up every [data-toggle-for] eye icon to show/hide its target password input */
function initPasswordToggles() {
  document.querySelectorAll('.field__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-toggle-for');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      const isHidden = input.type === 'password';

      input.type = isHidden ? 'text' : 'password';
      icon.className = isHidden ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  });
}

/** Basic RFC-5322-ish email check, good enough for client-side validation */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Mark a field valid/invalid and show/hide its error message */
function setFieldError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId).closest('.field');
  const errorEl = document.getElementById(errorId);
  if (message) {
    field.classList.add('has-error');
    field.classList.remove('is-valid');
    errorEl.textContent = message;
  } else {
    field.classList.remove('has-error');
    field.classList.add('is-valid');
    errorEl.textContent = '';
  }
}

/** Fade/slide-up reveal for any [data-reveal] element on the page (dashboard, admin panel). */
function initScrollReveal() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('is-visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', initPasswordToggles);
document.addEventListener('DOMContentLoaded', initScrollReveal);