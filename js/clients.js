/* ==========================================================================
   10X CRM — Clients page (P4: load, render, CRUD + Kanban/search/export)
   ========================================================================== */

/* ---- Shared field validation helpers (from auth.js) ---- */

function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(`${inputId}-error`);
  if (!input || !errorEl) return;
  const wrapper = input.closest('.field') || input.closest('.settings-item');
  if (wrapper) wrapper.classList.add('has-error');
  errorEl.textContent = message;
}

function clearFieldError(inputId) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(`${inputId}-error`);
  if (!input || !errorEl) return;
  const wrapper = input.closest('.field') || input.closest('.settings-item');
  if (wrapper) wrapper.classList.remove('has-error');
  errorEl.textContent = '';
}

function isValidEmailShape(email) {
  const at = email.indexOf('@');
  if (at < 0) return false;
  return email.indexOf('.', at) > at;
}

function clearAllErrors(fieldIds) {
  fieldIds.forEach(clearFieldError);
}

/* ---- Client-specific functions ---- */

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

/* ---- Filter, search, sort (P4.7) + server search (debounced) ---- */

let activeStatusFilter = 'All';
let currentSearchQuery = '';
let currentSortOption = 'newest';
let serverSearchIds = null; // Set of ids from GET /users/search, or null
let searchDebounceTimer = null;

const PAGE_SIZE = 9;
const MAX_DEAL_VALUE = 100000000; // $100M — a realistic ceiling for a single deal
let renderCount = PAGE_SIZE;
let currentView = 'grid'; // 'grid' | 'kanban'

function getVisibleClients() {
  const clients = getClients() || [];

  // Step 1: Filter by status
  let filtered = clients;
  if (activeStatusFilter !== 'All') {
    filtered = filtered.filter((c) => c.status === activeStatusFilter);
  }

  // Step 2: Search by name or company (instant, local) OR'd with whatever
  // the debounced server search (GET /users/search) has resolved so far.
  if (currentSearchQuery.trim()) {
    const q = currentSearchQuery.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (serverSearchIds && serverSearchIds.has(c.id))
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
  document.getElementById('client-count').textContent = `${visible.length} of ${getClients().length} clients`;

  if (currentView === 'kanban') {
    renderKanban(visible);
  } else {
    renderClients(visible.slice(0, renderCount));
    const loadMoreRow = document.getElementById('load-more-row');
    loadMoreRow.style.display = visible.length > renderCount ? 'flex' : 'none';
  }
}

function handleSearchInput(e) {
  currentSearchQuery = e.target.value;
  renderCount = PAGE_SIZE;
  updateClientsDisplay(); // instant local filtering while the server call is pending

  clearTimeout(searchDebounceTimer);
  const query = currentSearchQuery.trim();
  if (!query) {
    serverSearchIds = null;
    return;
  }
  searchDebounceTimer = setTimeout(async () => {
    serverSearchIds = await searchClientsOnServer(query);
    // The input may have moved on while we were waiting — only redraw if
    // this response still matches the current query.
    if (currentSearchQuery.trim() === query) {
      updateClientsDisplay();
    }
  }, 400);
}

function handleStatusFilter(status) {
  activeStatusFilter = status;
  renderCount = PAGE_SIZE;
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset.status === status);
  });
  updateClientsDisplay();
}

function handleSortChange(e) {
  currentSortOption = e.target.value;
  updateClientsDisplay();
}

function handleLoadMore() {
  renderCount += PAGE_SIZE;
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

/* ---- Grid view ---- */

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
            <button class="btn btn-card btn-secondary edit-client-btn" data-id="${client.id}" type="button">Edit</button>
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

  // Wire edit buttons
  document.querySelectorAll('.edit-client-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditClientModal(parseInt(btn.dataset.id, 10));
    });
  });

  // Wire details modal on card click
  openDetailsOnCardClick();
}

/* ---- Kanban view (drag & drop between status columns) ---- */

const KANBAN_STATUSES = ['Lead', 'Contacted', 'Won', 'Lost'];
let draggedClientId = null;

function renderKanban(list) {
  document.getElementById('clients-area').style.display = 'none';
  document.getElementById('load-more-row').style.display = 'none';
  const kanbanArea = document.getElementById('kanban-area');
  kanbanArea.style.display = 'block';

  const columnsHtml = KANBAN_STATUSES.map((status) => {
    const clientsInColumn = list.filter((c) => c.status === status);
    const cardsHtml = clientsInColumn.length
      ? clientsInColumn
          .map(
            (client) => `
        <div class="kanban-card" draggable="true" data-id="${client.id}">
          <div class="kanban-card__name">${client.name}</div>
          <div class="kanban-card__meta">${client.company || '—'}</div>
          <div class="kanban-card__deal">${formatMoney(client.dealValue)}</div>
        </div>
      `
          )
          .join('')
      : '<div class="kanban-empty">No clients</div>';

    return `
      <div class="kanban-column" data-status="${status}">
        <div class="kanban-column__header">
          <span>${status}</span>
          <span class="kanban-column__count">${clientsInColumn.length}</span>
        </div>
        <div class="kanban-column__body">${cardsHtml}</div>
      </div>
    `;
  }).join('');

  kanbanArea.innerHTML = `<div class="kanban-board">${columnsHtml}</div>`;

  // Card click -> open details
  kanbanArea.querySelectorAll('.kanban-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('is-dragging')) return;
      openDetailsModal(parseInt(card.dataset.id, 10));
    });
    card.addEventListener('dragstart', (e) => {
      draggedClientId = parseInt(card.dataset.id, 10);
      card.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      draggedClientId = null;
    });
  });

  // Column drop targets
  kanbanArea.querySelectorAll('.kanban-column').forEach((column) => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('is-drag-over');
    });
    column.addEventListener('dragleave', () => {
      column.classList.remove('is-drag-over');
    });
    column.addEventListener('drop', async (e) => {
      e.preventDefault();
      column.classList.remove('is-drag-over');
      const newStatus = column.dataset.status;
      if (draggedClientId == null) return;

      const clients = getClients();
      const client = clients.find((c) => c.id === draggedClientId);
      if (!client || client.status === newStatus) return;

      try {
        await updateClient(draggedClientId, { status: newStatus });
        updateClientsDisplay();
        showToast(`Moved to ${newStatus} ✓`, 'success');
      } catch (err) {
        showToast('Failed to update status.', 'error');
      }
    });
  });
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('#view-toggle button').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === view);
  });

  if (view === 'kanban') {
    document.getElementById('clients-area').style.display = 'none';
    document.getElementById('load-more-row').style.display = 'none';
    document.getElementById('kanban-area').style.display = 'block';
  } else {
    document.getElementById('clients-area').style.display = 'block';
    document.getElementById('kanban-area').style.display = 'none';
  }
  updateClientsDisplay();
}

/* ---- CSV export ---- */

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function handleExportCsv() {
  const clients = getVisibleClients();
  if (clients.length === 0) {
    showToast('Nothing to export.', 'error');
    return;
  }

  const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Deal Value', 'Client Since'];
  const rows = clients.map((c) => [
    c.name,
    c.email,
    c.phone || '',
    c.company || '',
    c.status,
    c.dealValue,
    new Date(c.createdAt).toLocaleDateString(),
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showToast(`Exported ${clients.length} clients ✓`, 'success');
}

/* ---- Details modal ---- */

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

  // Reset call timer
  resetCallTimer();

  // Show modal
  document.getElementById('details-modal').classList.add('is-open');
}

function closeDetailsModal() {
  document.getElementById('details-modal').classList.remove('is-open');
  selectedClientId = null;
  document.getElementById('add-note-input').value = '';
  stopCallTimer(false);
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
      // Don't open if clicking an action button
      if (e.target.closest('.delete-client-btn') || e.target.closest('.edit-client-btn')) return;
      const clientId = parseInt(card.dataset.id, 10);
      openDetailsModal(clientId);
    });
  });
}

/* ---- Call timer (details modal) ---- */

let callTimerInterval = null;
let callTimerSeconds = 0;
let callTimerRunning = false;

function formatTimer(totalSeconds) {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function resetCallTimer() {
  clearInterval(callTimerInterval);
  callTimerInterval = null;
  callTimerSeconds = 0;
  callTimerRunning = false;
  document.getElementById('call-timer-display').textContent = '00:00';
  document.getElementById('call-timer-display').classList.remove('is-running');
  document.getElementById('call-timer-btn').textContent = 'Start Call';
}

function startCallTimer() {
  callTimerRunning = true;
  document.getElementById('call-timer-btn').textContent = 'End Call';
  document.getElementById('call-timer-display').classList.add('is-running');
  callTimerInterval = setInterval(() => {
    callTimerSeconds++;
    document.getElementById('call-timer-display').textContent = formatTimer(callTimerSeconds);
  }, 1000);
}

function stopCallTimer(addNote) {
  if (!callTimerRunning) return;
  clearInterval(callTimerInterval);
  callTimerInterval = null;
  callTimerRunning = false;
  document.getElementById('call-timer-display').classList.remove('is-running');
  document.getElementById('call-timer-btn').textContent = 'Start Call';

  if (addNote && callTimerSeconds > 0 && selectedClientId) {
    const clients = getClients();
    const client = clients.find((c) => c.id === selectedClientId);
    if (client) {
      client.notes.push({
        text: `📞 Call duration: ${formatTimer(callTimerSeconds)}`,
        date: new Date().toLocaleString(),
      });
      saveClients(clients);
      renderNotesList(client.notes);
    }
  }

  callTimerSeconds = 0;
  document.getElementById('call-timer-display').textContent = '00:00';
}

function handleCallTimerToggle() {
  if (callTimerRunning) {
    stopCallTimer(true);
    showToast('Call logged ✓', 'success');
  } else {
    startCallTimer();
  }
}

/* ---- Loading / error states ---- */

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
    renderClients(clients.slice(0, renderCount));
    document.getElementById('client-count').textContent = `${clients.length} clients`;
  } catch (err) {
    renderLoadError();
  }
}

/* ---- Modal: Add / Edit Client (P4.4, P4.9) ---- */

let editingClientId = null;

function openAddClientModal() {
  editingClientId = null;
  document.getElementById('add-client-modal-title').textContent = 'Add Client';
  document.getElementById('add-client-submit-btn').textContent = 'Add Client';
  document.getElementById('add-client-modal-backdrop').classList.add('is-open');
}

function openEditClientModal(clientId) {
  const clients = getClients();
  const client = clients.find((c) => c.id === clientId);
  if (!client) return;

  editingClientId = clientId;
  document.getElementById('add-client-modal-title').textContent = 'Edit Client';
  document.getElementById('add-client-submit-btn').textContent = 'Save Changes';

  document.getElementById('name').value = client.name;
  document.getElementById('email').value = client.email;
  document.getElementById('phone').value = client.phone || '';
  document.getElementById('company').value = client.company || '';
  document.getElementById('dealValue').value = client.dealValue;
  document.getElementById('status').value = client.status;

  document.getElementById('add-client-modal-backdrop').classList.add('is-open');
}

function closeAddClientModal() {
  document.getElementById('add-client-modal-backdrop').classList.remove('is-open');
  document.getElementById('add-client-form').reset();
  clearAllAddClientErrors();
  editingClientId = null;
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
  } else if (clients.some((c) => c.email === email && c.id !== editingClientId)) {
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
  } else if (dealValue > MAX_DEAL_VALUE) {
    setFieldError('dealValue', `Deal value can't exceed ${formatMoney(MAX_DEAL_VALUE)}`);
    hasError = true;
  }

  if (hasError) return;

  try {
    if (editingClientId) {
      await updateClient(editingClientId, { name, email, phone, company, dealValue, status });
      showToast('Client updated ✓', 'success');
    } else {
      await addClient({
        name,
        email,
        phone,
        company,
        dealValue,
        status,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(name),
      });
      showToast('Client added ✓', 'success');
    }

    closeAddClientModal();
    updateClientsDisplay();
  } catch (err) {
    showToast(editingClientId ? 'Failed to update client. Try again.' : 'Failed to add client. Try again.', 'error');
  }
}

async function deleteClientHandler(clientId) {
  try {
    await deleteClient(clientId);
    updateClientsDisplay();
    showToast('Client deleted', 'success');
  } catch (err) {
    showToast('Failed to delete client.', 'error');
  }
}

/* ---- Keyboard shortcuts ----
   "/" focuses search, "N" opens the Add Client modal, "Esc" closes
   whichever modal is open. Ignored while typing in a form field (except
   Esc, and except "/" itself which is the thing that focuses the field). */

function isTypingInField(target) {
  return target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('add-client-modal-backdrop').classList.contains('is-open')) {
        closeAddClientModal();
      } else if (document.getElementById('details-modal').classList.contains('is-open')) {
        closeDetailsModal();
      }
      return;
    }

    if (isTypingInField(e.target)) return;

    if (e.key === '/') {
      e.preventDefault();
      document.getElementById('search-input').focus();
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      openAddClientModal();
    }
  });
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

  // Wire Add/Edit Client form
  document.getElementById('add-client-form').addEventListener('submit', handleAddClient);

  // Wire details modal close button and backdrop click
  document.getElementById('close-details-modal-btn').addEventListener('click', closeDetailsModal);
  document.getElementById('details-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetailsModal();
  });

  // Wire Edit button inside details modal
  document.getElementById('details-edit-btn').addEventListener('click', () => {
    if (!selectedClientId) return;
    const id = selectedClientId;
    closeDetailsModal();
    openEditClientModal(id);
  });

  // Wire note handlers
  document.getElementById('add-note-btn').addEventListener('click', handleAddNote);
  document.getElementById('add-note-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddNote();
  });

  document.getElementById('remind-btn').addEventListener('click', handleRemindMe);

  // Wire call timer
  document.getElementById('call-timer-btn').addEventListener('click', handleCallTimerToggle);

  // Wire view toggle (Grid / Kanban)
  document.querySelectorAll('#view-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Wire CSV export
  document.getElementById('export-csv-btn').addEventListener('click', handleExportCsv);

  // Wire Load More
  document.getElementById('load-more-btn').addEventListener('click', handleLoadMore);

  // Wire keyboard shortcuts
  initKeyboardShortcuts();
});