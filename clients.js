/* ==========================================================================
   10X CRM — Clients page (P4.2 loading, P4.3 rendering)
   Search, filters, sort, add, and delete land in later days — this page
   currently does exactly two things end-to-end: load and display.
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

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  initShell('clients');
  loadAndRenderClients();
});
