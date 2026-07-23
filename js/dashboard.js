/* ==========================================================================
   10X CRM — Dashboard page (P3)
   Stats, pipeline overview, recent clients, live clock
   ========================================================================== */

function calculateStats(clients) {
  const totalClients = clients.length;

  const activeDeals = clients.filter(
    (c) => c.status !== 'Won' && c.status !== 'Lost'
  ).length;

  const wonRevenue = clients
    .filter((c) => c.status === 'Won')
    .reduce((sum, c) => sum + c.dealValue, 0);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = clients.filter(
    (c) => new Date(c.createdAt).getTime() > sevenDaysAgo
  ).length;

  return { totalClients, activeDeals, wonRevenue, newThisWeek };
}

function calculatePipeline(clients) {
  const statuses = {};
  statuses['Lead'] = clients.filter((c) => c.status === 'Lead').length;
  statuses['Contacted'] = clients.filter((c) => c.status === 'Contacted').length;
  statuses['Won'] = clients.filter((c) => c.status === 'Won').length;
  statuses['Lost'] = clients.filter((c) => c.status === 'Lost').length;
  return statuses;
}

function getRecentClients(clients) {
  const sorted = [...clients].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return sorted.slice(0, 5);
}

function formatMoney(amount) {
  return `$${amount.toLocaleString('en-US')}`;
}

function statusBadgeClass(status) {
  switch (status) {
    case 'Contacted': return 'status-badge status-badge--contacted';
    case 'Won': return 'status-badge status-badge--won';
    case 'Lost': return 'status-badge status-badge--lost';
    case 'Lead':
    default: return 'status-badge status-badge--lead';
  }
}

function renderStats(stats) {
  const container = document.getElementById('stats-grid');
  const statsData = [
    { label: 'Total Clients', value: stats.totalClients },
    { label: 'Active Deals', value: stats.activeDeals },
    { label: 'Won Revenue', value: formatMoney(stats.wonRevenue) },
    { label: 'New This Week', value: stats.newThisWeek },
  ];

  const html = statsData
    .map(
      (stat) => `
    <div class="stat-card">
      <div class="stat-card__label">${stat.label}</div>
      <div class="stat-card__value">${stat.value}</div>
    </div>
  `
    )
    .join('');

  container.innerHTML = html;
}

function renderPipeline(pipeline) {
  const container = document.getElementById('pipeline-grid');
  const statuses = ['Lead', 'Contacted', 'Won', 'Lost'];

  const html = statuses
    .map(
      (status) => `
    <div class="pipeline-box">
      <div class="pipeline-box__status">${status}</div>
      <div class="pipeline-box__count">${pipeline[status]}</div>
    </div>
  `
    )
    .join('');

  container.innerHTML = html;
}

function renderRecentClients(recent) {
  const container = document.getElementById('recent-clients-list');

  if (recent.length === 0) {
    container.innerHTML = '<div class="state-message">No clients yet.</div>';
    return;
  }

  const html = recent
    .map(
      (client) => `
    <div class="recent-client-row">
      <div class="recent-client-row__name">${client.name}</div>
      <span class="${statusBadgeClass(client.status)}">${client.status}</span>
      <div class="recent-client-row__date">${new Date(client.createdAt).toLocaleDateString()}</div>
    </div>
  `
    )
    .join('');

  container.innerHTML = html;
}

function updateWelcome() {
  const session = getSession();
  if (!session) return;

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return;

  const firstName = user.fullName.split(' ')[0];
  document.getElementById('welcome-text').textContent = `Welcome back, ${firstName}!`;
}



async function initDashboard() {
  try {
    const clients = await ensureClientsLoaded();
    
    updateWelcome();
    updateLiveClock();
    setInterval(updateLiveClock, 1000); // Update clock every second

    const stats = calculateStats(clients);
    renderStats(stats);

    const pipeline = calculatePipeline(clients);
    renderPipeline(pipeline);

    const recent = getRecentClients(clients);
    renderRecentClients(recent);
  } catch (err) {
    console.error('Dashboard error:', err);
    document.querySelector('.content').innerHTML = `
      <div class="state-message">
        <strong>Could not load dashboard.</strong>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  initShell('dashboard');
  initDashboard();
});
