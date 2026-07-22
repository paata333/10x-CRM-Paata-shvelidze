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

/**
 * Adds a new client to the state and persists to localStorage.
 * Note: DummyJSON POST is mocked — it returns a response but doesn't persist
 * server-side. We manage persistence ourselves on the client.
 */
async function addClient(clientData) {
  // POST to DummyJSON (returns a mocked response with an id).
  const response = await fetch('https://dummyjson.com/users/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });

  if (!response.ok) {
    throw new Error(`Failed to add client: ${response.status}`);
  }

  const apiResponse = await response.json();

  // Build the full Client object using the API's response id + our fields.
  const newClient = {
    id: apiResponse.id,
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
 * Deletes a client from state and persists.
 * DummyJSON DELETE is mocked — we handle the removal on the client side.
 */
async function deleteClient(clientId) {
  const response = await fetch(`https://dummyjson.com/users/${clientId}`, {
    method: 'DELETE',
  });

  // Even if DummyJSON returns 404 (it does for user-added clients),
  // we still remove from our state, since that's the correct behavior.
  const clients = getClients();
  const filtered = clients.filter((c) => c.id !== clientId);
  saveClients(filtered);

  return filtered;
}
