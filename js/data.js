/* ==========================================================================
   10X CRM — Clients data layer (P4.2)
   Shared by clients.html now and dashboard.html later — both need the same
   "local first, API fallback" loading rule, so it lives in one place.
   ========================================================================== */

const CLIENTS_API_URL = 'https://dummyjson.com/users?limit=30';
const CLIENTS_SEARCH_URL = 'https://dummyjson.com/users/search';

/**
 * Queries DummyJSON's server-side search and returns the set of matching
 * ids. Used to widen the client-side name/company filter with whatever
 * the "server" considers a match (e.g. other fields we don't search
 * locally). Returns null on any failure so callers can fall back to
 * local-only filtering instead of showing an empty result.
 */
async function searchClientsOnServer(query) {
  try {
    const response = await fetch(`${CLIENTS_SEARCH_URL}?q=${encodeURIComponent(query)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return new Set((data.users || []).map((u) => u.id));
  } catch (err) {
    return null;
  }
}

/**
 * Each user's client list is stored under its own key, keyed off their
 * session userId — otherwise every account would read and write the same
 * shared "crm_clients" list. Returns null when there's no active session
 * (shouldn't happen on a guarded page, but fail closed rather than
 * silently touching the wrong data).
 */
function clientsStorageKey() {
  const session = getSession();
  return session ? `crm_clients_${session.userId}` : null;
}

function getClients() {
  const key = clientsStorageKey();
  if (!key) return null;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function saveClients(clients) {
  const key = clientsStorageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(clients));
}

/** Used by "Reset CRM Data" on the Profile page. */
function clearStoredClients() {
  const key = clientsStorageKey();
  if (key) localStorage.removeItem(key);
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

/**
 * Adds a new client to the state and persists to localStorage.
 * Note: DummyJSON POST is mocked — it returns a response but doesn't persist
 * server-side. We manage persistence ourselves on the client.
 */
async function addClient(clientData) {
  // POST to DummyJSON so the app exercises a real create request — but the
  // mock always returns the *same* static id (e.g. 209) no matter how many
  // times you call it, since it isn't actually tracking a growing dataset.
  // Trusting that id would give every added client the same id, so we
  // generate our own instead (same pattern used for new user accounts).
  try {
    await fetch('https://dummyjson.com/users/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    });
  } catch (err) {
    // Network hiccup — the client is still created locally below.
  }

  const newClient = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: clientData.name,
    email: clientData.email,
    phone: clientData.phone,
    company: clientData.company,
    image: clientData.image || 'https://api.dicebear.com/7.x/avataaars/svg',
    status: clientData.status,
    dealValue: clientData.dealValue,
    notes: [],
    createdAt: new Date().toISOString(),
  };

  // Add to the front of the clients array (unshift).
  const clients = getClients();
  clients.unshift(newClient);
  saveClients(clients);

  return newClient;
}

/**
 * Updates an existing client (P4.9 — Edit Client) and persists.
 * Sends the change to DummyJSON as a PUT (mocked, same as the other
 * verbs here) so the app exercises the full CRUD/request-method set.
 * Also used by Kanban drag & drop to update just the `status` field.
 */
async function updateClient(clientId, updates) {
  // Only clients seeded from the initial GET (ids 1-208 in DummyJSON's real
  // dataset) exist server-side. Clients added locally get a mock id from
  // POST /users/add that DummyJSON never actually persists, so PUTting to
  // it would just be a guaranteed, noisy 404 — skip the network call for
  // those and go straight to the local update.
  if (clientId <= 208) {
    try {
      await fetch(`https://dummyjson.com/users/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      // Network hiccup — local storage stays the source of truth regardless.
    }
  }

  const clients = getClients();
  const client = clients.find((c) => c.id === clientId);
  if (!client) throw new Error('Client not found');

  Object.assign(client, updates);
  saveClients(clients);

  return client;
}

/**
 * Deletes a client from state and persists.
 * DummyJSON DELETE is mocked — we handle the removal on the client side.
 */
async function deleteClient(clientId) {
  // Same reasoning as updateClient's PUT: only ids 1-208 exist server-side.
  if (clientId <= 208) {
    try {
      await fetch(`https://dummyjson.com/users/${clientId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      // Network hiccup — local storage stays the source of truth regardless.
    }
  }

  const clients = getClients();
  const filtered = clients.filter((c) => c.id !== clientId);
  saveClients(filtered);

  return filtered;
}