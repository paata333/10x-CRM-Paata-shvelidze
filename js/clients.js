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

/* ---- Filter, search, sort (P4.7) ---- */

let activeStatusFilter = 'All';
let currentSearchQuery = '';
let currentSortOption = 'newest';

function getVisibleClients() {
  const clients = getClients() || [];

  // Step 1: Filter by status
  let filtered = clients;
  if (activeStatusFilter !== 'All') {
    filtered = filtered.filter((c) => c.status === activeStatusFilter);
  }

  // Step 2: Search by name or company
  if (currentSearchQuery.trim()) {
    const q = currentSearchQuery.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
    );
  }

  // Step 3: Sort
  let sorted = [...filtered]; // copy to avoid mutating
  switch (currentSortOption) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'deal-value':
      sorted.sort((a, b) => b.dealValue - a.dealValue);
      break;
    case 'newest':
    default:
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
  }

  return sorted;
}

function updateClientsDisplay() {
  const visible = getVisibleClients();
  renderClients(visible);
  document.getElementById('client-count').textContent = `${visible.length} of ${getClients().length} clients`;
}

function handleSearchInput(e) {
  currentSearchQuery = e.target.value;
  updateClientsDisplay();
}

function handleStatusFilter(status) {
  activeStatusFilter = status;
  // Update chip active state
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset.status === status);
  });
  updateClientsDisplay();
}

function handleSortChange(e) {
  currentSortOption = e.target.value;
  updateClientsDisplay();
}

function renderFilterChips(allClients) {
  const container = document.getElementById('filter-chips');
  if (!container) return;

  const chips = ['All', 'Lead', 'Contacted', 'Won', 'Lost'];
  const chipHtml = chips
    .map((status) => {
      const activeClass = activeStatusFilter === status ? ' is-active' : '';
      return `<button class="chip${activeClass}" data-status="${status}" type="button">${status}</button>`;
    })
    .join('');

  container.innerHTML = chipHtml;

  container.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => handleStatusFilter(btn.dataset.status));
  });
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
          <div class="client-card__actions">
            <button class="btn btn-card btn-danger delete-client-btn" data-id="${client.id}" type="button">Delete</button>
          </div>
        </div>
      </div>
    `)
    .join('');

  container.innerHTML = `<div class="client-grid">${cardsHtml}</div>`;
  
  // Wire delete buttons
  document.querySelectorAll('.delete-client-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const clientId = parseInt(btn.dataset.id, 10);
      const clients = getClients();
      const client = clients.find((c) => c.id === clientId);
      if (!client) return;
      
      if (confirm(`Delete this client? This cannot be undone.`)) {
        deleteClientHandler(clientId);
      }
    });
  });

  // Wire details modal on card click
  openDetailsOnCardClick();
}

let selectedClientId = null;

function openDetailsModal(clientId) {
  selectedClientId = clientId;
  const clients = getClients();
  const client = clients.find((c) => c.id === clientId);
  if (!client) return;

  // Render header
  document.getElementById('details-avatar').src = client.image;
  document.getElementById('details-avatar').onerror = function() {
    this.style.display = 'none';
  };
  document.getElementById('details-name').textContent = client.name;
  document.getElementById('details-company').textContent = client.company || '—';

  // Render info fields
  document.getElementById('details-email').textContent = client.email;
  document.getElementById('details-phone').textContent = client.phone || '—';
  document.getElementById('details-status').textContent = client.status;
  document.getElementById('details-status').className = statusBadgeClass(client.status);
  document.getElementById('details-deal-value').textContent = formatMoney(client.dealValue);
  document.getElementById('details-since').textContent = new Date(client.createdAt).toLocaleDateString();

  // Render notes
  renderNotesList(client.notes);

  // Show modal
  document.getElementById('details-modal').classList.add('is-open');
}

function closeDetailsModal() {
  document.getElementById('details-modal').classList.remove('is-open');
  selectedClientId = null;
  document.getElementById('add-note-input').value = '';
}

function renderNotesList(notes) {
  const container = document.getElementById('notes-list');
  if (notes.length === 0) {
    container.innerHTML = '<div style="font-size:13px; color:var(--ink-faint); text-align:center; padding:12px;">No notes yet.</div>';
    return;
  }

  const html = notes
    .map(
      (note) => `
    <div class="note-item">
      <div class="note-text">${note.text}</div>
      <div class="note-date">${note.date}</div>
    </div>
  `
    )
    .join('');

  container.innerHTML = html;
}

function handleAddNote() {
  if (!selectedClientId) return;

  const input = document.getElementById('add-note-input');
  const noteText = input.value.trim();

  if (!noteText) return;

  const clients = getClients();
  const client = clients.find((c) => c.id === selectedClientId);
  if (!client) return;

  client.notes.push({
    text: noteText,
    date: new Date().toLocaleString(),
  });

  saveClients(clients);
  renderNotesList(client.notes);
  input.value = '';
}

function handleRemindMe() {
  if (!selectedClientId) return;

  const clients = getClients();
  const client = clients.find((c) => c.id === selectedClientId);
  if (!client) return;

  showToast('Reminder set ✓', 'success');

  setTimeout(() => {
    showToast(`⏰ Follow up: ${client.name}`, 'info', 5000);
  }, 60000);
}

function openDetailsOnCardClick() {
  document.querySelectorAll('.client-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      // Don't open if clicking delete button
      if (e.target.closest('.delete-client-btn')) return;
      const clientId = parseInt(card.dataset.id, 10);
      openDetailsModal(clientId);
    });
  });
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
  
  // Load and render
  (async () => {
    renderLoading();
    try {
      const clients = await ensureClientsLoaded();
      renderFilterChips(clients);
      updateClientsDisplay();
      
      // Wire search input
      document.getElementById('search-input').addEventListener('input', handleSearchInput);
      
      // Wire sort select
      document.getElementById('sort-select').addEventListener('change', handleSortChange);
    } catch (err) {
      renderLoadError();
    }
  })();

  // Wire Add Client button
  document.getElementById('add-client-btn').addEventListener('click', openAddClientModal);
  
  // Wire modal close button and backdrop click
  document.getElementById('close-modal-btn').addEventListener('click', closeAddClientModal);
  document.getElementById('add-client-modal-backdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddClientModal();
  });

  // Wire Add Client form
  document.getElementById('add-client-form').addEventListener('submit', handleAddClient);

  // Wire details modal close button and backdrop click
  document.getElementById('close-details-modal-btn').addEventListener('click', closeDetailsModal);
  document.getElementById('details-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetailsModal();
  });

  // Wire note handlers
  document.getElementById('add-note-btn').addEventListener('click', handleAddNote);
  document.getElementById('add-note-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddNote();
  });

  document.getElementById('remind-btn').addEventListener('click', handleRemindMe);
});
