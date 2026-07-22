/* ==========================================================================
   10X CRM — Clients page (P4: load, render, CRUD)
   ========================================================================== */

function statusBadgeClass(status) {
  switch (status) {
    case 'Contacted': return 'status-badge status-badge--contacted';
    case 'Won': return 'status-badge status-badge--won';
    case 'Lost': return 'status-badge status-badge--lost';
    case 'Lead':
    default: return 'status-badge status-badge--lead';
  }
}

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function formatMoney(amount) {
  return `$${amount.toLocaleString('en-US')}`;
}

function renderClients(list) {
  const container = document.getElementById('clients-area');

  if (list.length === 0) {
    container.innerHTML = `
      <div class="state-message">
        <strong>No clients found.</strong>
      </div>
    `;
    return;
  }

  const cardsHtml = list
    .map((client) => `
      <div class="client-card" data-id="${client.id}">
        <div class="client-card__avatar" data-fallback="${initials(client.name)}">
          <img src="${client.image}" alt="" width="44" height="44"
               style="width:100%;height:100%;border-radius:50%;object-fit:cover;"
               onerror="this.replaceWith(Object.assign(document.createElement('span'), {textContent: this.parentElement.dataset.fallback}))" />
        </div>
        <div class="client-card__body">
          <div class="client-card__name">${client.name}</div>
          <div class="client-card__meta">${client.company || '—'}</div>
          <div class="client-card__meta">${client.email}</div>
          <div class="client-card__footer">
            <span class="${statusBadgeClass(client.status)}">${client.status}</span>
            <span class="client-card__deal">${formatMoney(client.dealValue)}</span>
          </div>
        </div>
      </div>
    `)
    .join('');

  container.innerHTML = `<div class="client-grid">${cardsHtml}</div>`;
}

function renderLoading() {
  document.getElementById('clients-area').innerHTML = `
    <div class="state-message">
      <div class="spinner"></div>
      <span>Loading clients...</span>
    </div>
  `;
}

function renderLoadError() {
  document.getElementById('clients-area').innerHTML = `
    <div class="state-message">
      <strong>Could not load clients. Check your connection and try again.</strong>
      <button class="btn btn-secondary" id="retry-btn" type="button">Retry</button>
    </div>
  `;
  document.getElementById('retry-btn').addEventListener('click', loadAndRenderClients);
}

async function loadAndRenderClients() {
  renderLoading();
  try {
    const clients = await ensureClientsLoaded();
    renderClients(clients);
    document.getElementById('client-count').textContent = `${clients.length} clients`;
  } catch (err) {
    renderLoadError();
  }
}

/* ---- Modal: Add Client (P4.4) ---- */

function openAddClientModal() {
  document.getElementById('add-client-modal-backdrop').classList.add('is-open');
}

function closeAddClientModal() {
  document.getElementById('add-client-modal-backdrop').classList.remove('is-open');
  document.getElementById('add-client-form').reset();
  clearAllAddClientErrors();
}

function clearAllAddClientErrors() {
  ['name', 'email', 'phone', 'company', 'dealValue'].forEach((fieldId) => {
    clearFieldError(fieldId);
  });
}

async function handleAddClient(event) {
  event.preventDefault();
  clearAllAddClientErrors();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const phone = document.getElementById('phone').value.trim();
  const company = document.getElementById('company').value.trim();
  const dealValue = parseFloat(document.getElementById('dealValue').value);
  const status = document.getElementById('status').value || 'Lead';

  let hasError = false;
  const clients = getClients();

  if (name.length < 3) {
    setFieldError('name', 'Name must be at least 3 characters');
    hasError = true;
  }

  if (!isValidEmailShape(email)) {
    setFieldError('email', 'Please enter a valid email address');
    hasError = true;
  } else if (clients.some((c) => c.email === email)) {
    setFieldError('email', 'A client with this email already exists');
    hasError = true;
  }

  if (phone && phone.length < 6) {
    setFieldError('phone', 'Phone number looks too short');
    hasError = true;
  }

  if (!dealValue || dealValue <= 0 || isNaN(dealValue)) {
    setFieldError('dealValue', 'Deal value must be a positive number');
    hasError = true;
  }

  if (hasError) return;

  try {
    await addClient({
      name,
      email,
      phone,
      company,
      dealValue,
      status,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(name),
    });

    closeAddClientModal();
    const allClients = getClients();
    renderClients(allClients);
    document.getElementById('client-count').textContent = `${allClients.length} clients`;
    showToast('Client added ✓', 'success');
  } catch (err) {
    showToast('Failed to add client. Try again.', 'error');
  }
}

async function deleteClientHandler(clientId) {
  try {
    await deleteClient(clientId);
    const allClients = getClients();
    renderClients(allClients);
    document.getElementById('client-count').textContent = `${allClients.length} clients`;
    showToast('Client deleted', 'success');
  } catch (err) {
    showToast('Failed to delete client.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  initShell('clients');
  loadAndRenderClients();

  // Wire Add Client button
  document.getElementById('add-client-btn').addEventListener('click', openAddClientModal);
  
  // Wire modal close button and backdrop click
  document.getElementById('close-modal-btn').addEventListener('click', closeAddClientModal);
  document.getElementById('add-client-modal-backdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddClientModal();
  });

  // Wire Add Client form
  document.getElementById('add-client-form').addEventListener('submit', handleAddClient);
});
