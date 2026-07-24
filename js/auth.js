/* ==========================================================================
   10X CRM — Auth logic (P1 Sign Up, P2 Login)
   getUsers/saveUsers/getSession/saveSession now live in guard.js, since
   every protected page loads that file first.
   ========================================================================== */

/* ---- field-level error helpers ----------------------------------------
   Every input lives inside a `.field` wrapper with a sibling
   `.field-error` element carrying the id `${inputId}-error`.
   ------------------------------------------------------------------- */

function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(`${inputId}-error`);
  if (!input || !errorEl) return;
  const wrapper = input.closest('.field') || input.closest('.settings-item');
  if (wrapper) wrapper.classList.add('has-error');
  errorEl.textContent = message;
}

function clearFieldError(inputId) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(`${inputId}-error`);
  if (!input || !errorEl) return;
  const wrapper = input.closest('.field') || input.closest('.settings-item');
  if (wrapper) wrapper.classList.remove('has-error');
  errorEl.textContent = '';
}

function clearAllErrors(fieldIds) {
  fieldIds.forEach(clearFieldError);
}

function isValidEmailShape(email) {
  const at = email.indexOf('@');
  if (at < 0) return false;
  return email.indexOf('.', at) > at;
}

/* ==========================================================================
   Sign Up (P1)
   ========================================================================== */

function initSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  const fieldIds = ['fullName', 'email', 'password', 'confirmPassword'];

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearAllErrors(fieldIds);

    const fullName = document.getElementById('fullName').value.trim();
    const emailRaw = document.getElementById('email').value.trim();
    const email = emailRaw.toLowerCase();
    const company = document.getElementById('company').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let hasError = false;
    const users = getUsers();

    if (fullName.length < 3) {
      setFieldError('fullName', 'Full name must be at least 3 characters');
      hasError = true;
    }

    if (!isValidEmailShape(emailRaw)) {
      setFieldError('email', 'Please enter a valid email address');
      hasError = true;
    } else if (users.some((u) => u.email === email)) {
      setFieldError('email', 'An account with this email already exists');
      hasError = true;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    if (password.length < 8 || !hasLetter || !hasDigit) {
      setFieldError(
        'password',
        'Password must be at least 8 characters and contain a letter and a number'
      );
      hasError = true;
    }

    if (confirmPassword !== password) {
      setFieldError('confirmPassword', 'Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    const newUser = {
      id: Date.now(),
      fullName,
      email,
      password,
      company,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    showToast('Account created successfully! Please log in.', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  });
}

/* ==========================================================================
   Login (P2)
   ========================================================================== */

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const fieldIds = ['email', 'password'];
  const alertBox = document.getElementById('login-alert');

  function hideAlert() {
    alertBox.classList.remove('is-visible');
    alertBox.textContent = '';
  }

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.classList.add('is-visible');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearAllErrors(fieldIds);
    hideAlert();

    const emailRaw = document.getElementById('email').value.trim();
    const email = emailRaw.toLowerCase();
    const password = document.getElementById('password').value;

    let hasError = false;

    if (!emailRaw) {
      setFieldError('email', 'Email is required');
      hasError = true;
    }

    if (!password) {
      setFieldError('password', 'Password is required');
      hasError = true;
    }

    if (hasError) return;

    const users = getUsers();
    const match = users.find((u) => u.email === email && u.password === password);

    if (!match) {
      showAlert('Invalid email or password');
      return;
    }

    const rememberBox = document.getElementById('remember-me');
    const remember = rememberBox ? rememberBox.checked : true;

    saveSession(
      {
        userId: match.id,
        email: match.email,
        loginAt: new Date().toISOString(),
      },
      remember
    );

    window.location.href = 'dashboard.html';
  });
}

/* ==========================================================================
   Password strength meter (P1 signup)
   ========================================================================== */

function scorePasswordStrength(password) {
  if (!password) return { label: '', level: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', level: 1 };
  if (score <= 3) return { label: 'Medium', level: 2 };
  return { label: 'Strong', level: 3 };
}

function initPasswordStrengthMeter() {
  const input = document.getElementById('password');
  const meter = document.getElementById('password-strength');
  if (!input || !meter) return;

  input.addEventListener('input', () => {
    const { label, level } = scorePasswordStrength(input.value);
    meter.className = 'password-strength' + (level ? ` is-level-${level}` : '');
    meter.querySelector('.password-strength__label').textContent = label;
  });
}