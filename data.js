/* ==========================================================================
   10X CRM — Clients data layer (P4.2)
   Shared by clients.html now and dashboard.html later — both need the same
   "local first, API fallback" loading rule, so it lives in one place.
   ========================================================================== */

const CLIENTS_API_URL = 'https://dummyjson.com/users?limit=30';

function getClients() {
  const raw = localStorage.getItem('crm_clients');
  return raw ? JSON.parse(raw) : null;
}

function saveClients(clients) {
  localStorage.setItem('crm_clients', JSON.stringify(clients));
}

/** Turns one DummyJSON user record into a Client object (P4.2). */
function mapApiUserToClient(user) {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phone,
    company: user.company && user.company.name ? user.company.name : '',
    image: user.image,
    status: 'Lead',
    dealValue: Math.floor(Math.random() * (10000 - 500 + 1)) + 500,
    notes: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Resolves to the current client list: from localStorage if present,
 * otherwise fetched fresh from DummyJSON (and then persisted).
 * Throws on network/response failure so callers can show a retry state.
 */
async function ensureClientsLoaded() {
  const cached = getClients();
  if (cached) return cached;

  const response = await fetch(CLIENTS_API_URL);
  if (!response.ok) {
    throw new Error(`DummyJSON request failed with status ${response.status}`);
  }

  const data = await response.json();
  const clients = data.users.map(mapApiUserToClient);
  saveClients(clients);
  return clients;
}
