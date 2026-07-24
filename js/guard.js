/* ==========================================================================
   10X CRM — Auth guard (P0.1)
   One shared place for access-control logic; every page calls into this
   instead of re-implementing the checks.
   ========================================================================== */

/**
 * A session lives in one of two places depending on "Remember me":
 * localStorage when the user opted in (persists across browser restarts),
 * sessionStorage when they didn't (cleared the moment the tab closes).
 */
function isLoggedIn() {
  return localStorage.getItem('crm_session') !== null || sessionStorage.getItem('crm_session') !== null;
}

/**
 * Call on protected pages (dashboard, clients, profile).
 * If there is no session, redirect straight to the login page.
 */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'index.html';
  }
}

/**
 * Call on public pages (login, signup).
 * If a session already exists, there is no reason to see the login/signup
 * form again — send the user straight to their dashboard.
 */
function redirectIfAuthed() {
  if (isLoggedIn()) {
    window.location.href = 'dashboard.html';
  }
}

/** Clears the session and returns to the login page. Data is untouched. */
function logout() {
  localStorage.removeItem('crm_session');
  sessionStorage.removeItem('crm_session');
  window.location.href = 'index.html';
}
