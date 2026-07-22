/* ==========================================================================
   10X CRM — Shared UI helpers (toast notifications, P0.4)
   ========================================================================== */

/**
 * Shows a global toast message.
 * @param {string} message - the text to display
 * @param {'success'|'error'} type - visual style of the toast
 * @param {number} duration - ms before auto-dismiss (default 3000)
 */
function showToast(message, type = 'success', duration = 3000) {
  let region = document.getElementById('toast-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'toast-region';
    document.body.appendChild(region);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(text);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.setAttribute('aria-label', 'Dismiss');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => toast.remove());
  toast.appendChild(closeBtn);

  region.appendChild(toast);

  setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, duration);
}
