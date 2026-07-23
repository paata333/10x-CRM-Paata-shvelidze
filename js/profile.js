/* ==========================================================================
   10X CRM — Profile page (P5)
   Edit profile, change password, reset CRM data
   ========================================================================== */

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function renderUserInfo() {
  const session = getSession();
  if (!session) return;

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return;

  document.getElementById('profile-avatar').textContent = initials(user.fullName);
  document.getElementById('profile-name').textContent = user.fullName;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-member-since').textContent = `Member since ${new Date(user.createdAt).toLocaleDateString()}`;

  // Pre-fill edit form
  document.getElementById('edit-fullName').value = user.fullName;
  document.getElementById('edit-company').value = user.company;
}

function handleEditProfile(event) {
  event.preventDefault();
  clearAllErrors(['edit-fullName', 'edit-company']);

  const fullName = document.getElementById('edit-fullName').value.trim();
  const company = document.getElementById('edit-company').value.trim();

  let hasError = false;

  if (fullName.length < 3) {
    setFieldError('edit-fullName', 'Full name must be at least 3 characters');
    hasError = true;
  }

  if (hasError) return;

  const session = getSession();
  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);

  if (user) {
    user.fullName = fullName;
    user.company = company;
    saveUsers(users);
    renderUserInfo();
    showToast('Profile updated ✓', 'success');
  }
}

function handleChangePassword(event) {
  event.preventDefault();
  clearAllErrors(['current-password', 'new-password', 'confirm-new-password']);

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmNewPassword = document.getElementById('confirm-new-password').value;

  let hasError = false;
  const session = getSession();
  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);

  if (!user) {
    showToast('User not found.', 'error');
    return;
  }

  if (currentPassword !== user.password) {
    setFieldError('current-password', 'Current password is incorrect');
    hasError = true;
  }

  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  if (newPassword.length < 8 || !hasLetter || !hasDigit) {
    setFieldError(
      'new-password',
      'Password must be at least 8 characters and contain a letter and a number'
    );
    hasError = true;
  }

  if (newPassword === currentPassword) {
    setFieldError(
      'new-password',
      'New password must be different from the current one'
    );
    hasError = true;
  }

  if (confirmNewPassword !== newPassword) {
    setFieldError('confirm-new-password', 'Passwords do not match');
    hasError = true;
  }

  if (hasError) return;

  user.password = newPassword;
  saveUsers(users);

  document.getElementById('change-password-form').reset();
  showToast('Password changed ✓', 'success');
}

function handleResetData() {
  if (!confirm('Reset all CRM data? This will reload clients from the API.')) {
    return;
  }

  localStorage.removeItem('crm_clients');

  (async () => {
    try {
      await ensureClientsLoaded();
      showToast('CRM data reset. Clients reloaded from API.', 'success');
    } catch (err) {
      showToast('Failed to reload clients.', 'error');
    }
  })();
}

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  initShell('profile');
  renderUserInfo();

  document.getElementById('edit-profile-form').addEventListener('submit', handleEditProfile);
  document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
  document.getElementById('reset-data-btn').addEventListener('click', handleResetData);
});
