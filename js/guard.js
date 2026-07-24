/* ==========================================================================
   10X CRM — Auth guard (P0.1) + shared user/session storage
   One shared place for access-control logic and the user/session storage
   helpers, since every protected page loads this file first (before
   auth.js, data.js, etc.) — anything another script needs at any point
   belongs here, not in a page-specific file.
   ========================================================================== */

/* ---- user storage ---- */

function getUsers() {
  const raw = localStorage.getItem('crm_users');
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem('crm_users', JSON.stringify(users));
}

/* ---- session storage ----
   A session lives in one of two places depending on "Remember me":
   localStorage when the user opted in (persists across browser restarts),
   sessionStorage when they didn't (cleared the moment the tab closes). */

function getSession() {
  const raw = localStorage.getItem('crm_session') || sessionStorage.getItem('crm_session');
  return raw ? JSON.parse(raw) : null;
}

/**
 * "Remember me" checked -> localStorage (survives browser restarts).
 * "Remember me" unchecked -> sessionStorage (gone when the tab closes).
 * Always clear the other one first so a later login can't leave two
 * conflicting sessions behind.
 */
function saveSession(session, remember) {
  localStorage.removeItem('crm_session');
  sessionStorage.removeItem('crm_session');
  if (remember) {
    localStorage.setItem('crm_session', JSON.stringify(session));
  } else {
    sessionStorage.setItem('crm_session', JSON.stringify(session));
  }
}

function isLoggedIn() {
  return getSession() !== null;
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