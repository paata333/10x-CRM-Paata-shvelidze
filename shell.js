/* ==========================================================================
   10X CRM — Protected-page shell: sidebar nav + theme toggle (P0.2, P0.3)
   Every protected page calls initShell('dashboard' | 'clients' | 'profile')
   once its <div id="sidebar-root"> exists in the DOM.
   ========================================================================== */

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
  { key: 'clients', label: 'Clients', href: 'clients.html' },
  { key: 'profile', label: 'Profile', href: 'profile.html' },
];

function getTheme() {
  return localStorage.getItem('crm_theme') || 'light';
}

/** Applied as early as possible (inline, in <head>) to avoid a flash. */
function applyStoredTheme() {
  if (getTheme() === 'dark') {
    document.documentElement.classList.add('theme-dark');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('theme-dark');
  localStorage.setItem('crm_theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('theme-toggle-label');
  if (btn) btn.textContent = isDark ? 'Light mode' : 'Dark mode';
}

function buildSidebar(activePage) {
  const links = NAV_ITEMS.map((item) => {
    const activeClass = item.key === activePage ? ' is-active' : '';
    return `<li><a class="nav-link${activeClass}" href="${item.href}">${item.label}</a></li>`;
  }).join('');

  const isDark = document.documentElement.classList.contains('theme-dark');

  return `
    <aside class="sidebar">
      <a href="dashboard.html" class="brand-mark" style="text-decoration:none;">
        <span class="brand-mark__glyph">×10</span>
        <span class="brand-mark__text">10X CRM</span>
      </a>
      <ul class="nav-links">${links}</ul>
      <div class="sidebar-spacer"></div>
      <div class="sidebar-foot">
        <button class="sidebar-btn" id="theme-toggle-btn" type="button">
          <span id="theme-toggle-label">${isDark ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button class="sidebar-btn" id="logout-btn" type="button">Logout</button>
      </div>
    </aside>
  `;
}

/**
 * Renders the sidebar into #sidebar-root and wires up theme/logout.
 * @param {'dashboard'|'clients'|'profile'} activePage
 */
function initShell(activePage) {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  root.outerHTML = buildSidebar(activePage);

  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
  document.getElementById('logout-btn').addEventListener('click', logout);
}
