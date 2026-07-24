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
    <button class="sidebar-overlay" id="sidebar-overlay" type="button" aria-label="Close menu"></button>
  `;
}

/** Small topbar shown only on phones/tablets (<=860px), holds the burger toggle. */
function buildMobileTopbar() {
  return `
    <header class="mobile-topbar">
      <button class="burger-btn" id="burger-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="sidebar-root">
        <span class="burger-btn__bars"><span></span><span></span><span></span></span>
      </button>
      <a href="dashboard.html" class="brand-mark" style="text-decoration:none;">
        <span class="brand-mark__glyph">×10</span>
        <span class="brand-mark__text">10X CRM</span>
      </a>
    </header>
  `;
}

function openSidebar() {
  document.body.classList.add('sidebar-open', 'no-scroll');
  const btn = document.getElementById('burger-btn');
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  document.body.classList.remove('sidebar-open', 'no-scroll');
  const btn = document.getElementById('burger-btn');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function toggleSidebar() {
  if (document.body.classList.contains('sidebar-open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

/**
 * Renders the sidebar into #sidebar-root and wires up theme/logout.
 * Also injects the mobile-only top bar (burger menu) right before the
 * app shell, so phones/tablets get an off-canvas nav drawer instead of
 * a cramped inline nav.
 * @param {'dashboard'|'clients'|'profile'} activePage
 */
function initShell(activePage) {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  root.outerHTML = buildSidebar(activePage);

  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
  document.getElementById('logout-btn').addEventListener('click', logout);
  initLogoEasterEgg();
  initMobileNav();
}

/** Wires up the burger button, overlay, Escape key, and auto-close-on-navigate. */
function initMobileNav() {
  const appShell = document.querySelector('.app-shell');
  if (appShell && !document.querySelector('.mobile-topbar')) {
    appShell.insertAdjacentHTML('beforebegin', buildMobileTopbar());
  }

  const burgerBtn = document.getElementById('burger-btn');
  const overlay = document.getElementById('sidebar-overlay');

  if (burgerBtn) burgerBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  // Tapping a nav link on mobile should close the drawer immediately.
  document.querySelectorAll('.sidebar .nav-link').forEach((link) => {
    link.addEventListener('click', closeSidebar);
  });
}

/* ---- Easter egg: click the logo 5x within 2s ---- */

const EGG_MESSAGES = [
  "🚀 Revenue go brrr.",
  "🥚 You found the secret stash of enthusiasm.",
  "👀 Someone's avoiding their pipeline.",
];

function initLogoEasterEgg() {
  const logo = document.querySelector('.sidebar .brand-mark');
  if (!logo) return;

  let clicks = 0;
  let resetTimer = null;

  logo.addEventListener('click', (e) => {
    e.preventDefault();
    clicks++;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { clicks = 0; }, 2000);

    if (clicks >= 5) {
      clicks = 0;
      logo.classList.remove('is-egg');
      void logo.offsetWidth; // restart animation
      logo.classList.add('is-egg');
      const msg = EGG_MESSAGES[Math.floor(Math.random() * EGG_MESSAGES.length)];
      showToast(msg, 'info', 4000);
    }
  });
}
