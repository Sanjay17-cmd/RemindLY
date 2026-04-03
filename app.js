// ── State ──────────────────────────────────────────────
let tasks = [];
let filter = 'all';
let editingId = null;
let syncTimer = null;
let gistId = localStorage.getItem('remindly_gist_id') || null;
let token = localStorage.getItem('remindly_token') || null;

// ── Init ────────────────────────────────────────────────
async function init() {
  // Load local first for instant render
  const local = localStorage.getItem('remindly_tasks');
  if (local) tasks = JSON.parse(local);
  render();

  // Show setup banner if no token
  if (!token) {
    document.getElementById('setup-banner').classList.add('show');
    setSyncStatus('local', 'local');
  } else {
    setSyncStatus('syncing', 'syncing…');
    await syncFromGist();
  }

  // Tab listeners
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      filter = tab.dataset.filter;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      render();
    });
  });

  // Enter key on input
  document.getElementById('new-task-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });

  // Settings button
  document.getElementById('settings-btn').addEventListener('click', openSettings);

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

// ── Render ──────────────────────────────────────────────
function render() {
  updateStats();

  let filtered = tasks;
  if (filter === 'open')  filtered = tasks.filter(t => !t.done);
  if (filter === 'done')  filtered = tasks.filter(t => t.done);
  if (filter === 'high')  filtered = tasks.filter(t => t.priority === 'high' && !t.done);

  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.classList.add('show');
    return;
  }
  empty.classList.remove('show');

  // Sort: undone first, then by priority weight, then by date
  const pWeight = { high: 0, med: 1, low: 2 };
  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (pWeight[a.priority] - pWeight[b.priority]) || (b.id - a.id);
  });

  list.innerHTML = sorted.map(task => taskHTML(task)).join('');
}

function taskHTML(t) {
  const timeStr = relativeTime(t.id);
  const catBadge = t.category ? `<span class="task-category">${esc(t.category)}</span>` : '';
  const pBadge = `<span class="priority-badge pb-${t.priority}">${t.priority}</span>`;
  const checkMark = t.done ? '✓' : '';

  return `
  <div class="task-card ${t.done ? 'done' : ''} p-${t.priority}" data-id="${t.id}">
    <div class="task-check" onclick="toggleDone(${t.id})">${checkMark}</div>
    <div class="task-body">
      <div class="task-text">${esc(t.text)}</div>
      <div class="task-meta">
        <span class="task-time">${timeStr}</span>
        ${catBadge}
        ${pBadge}
      </div>
    </div>
    <div class="task-actions">
      <button class="act-btn" onclick="openEdit(${t.id})" title="Edit">✎</button>
      <button class="act-btn del" onclick="deleteTask(${t.id})" title="Delete">✕</button>
    </div>
  </div>`;
}

function updateStats() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const open  = total - done;
  const high  = tasks.filter(t => t.priority === 'high' && !t.done).length;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-open').textContent  = open;
  document.getElementById('stat-done').textContent  = done;
  document.getElementById('stat-high').textContent  = high;
}

// ── Task Operations ─────────────────────────────────────
function addTask() {
  const input = document.getElementById('new-task-input');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  const priority = document.getElementById('priority-select').value;
  const task = {
    id: Date.now(),
    text,
    priority,
    category: '',
    done: false,
  };

  tasks.unshift(task);
  input.value = '';
  saveAndSync();
  render();
  showToast('Task added');
}

function toggleDone(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveAndSync();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveAndSync();
  render();
  showToast('Deleted');
}

// ── Edit Modal ──────────────────────────────────────────
function openEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;
  document.getElementById('edit-text').value = task.text;
  document.getElementById('edit-category').value = task.category || '';
  document.getElementById('edit-priority').value = task.priority;
  openModal('edit-modal');
}

function saveEdit() {
  const task = tasks.find(t => t.id === editingId);
  if (!task) return;
  task.text = document.getElementById('edit-text').value.trim() || task.text;
  task.category = document.getElementById('edit-category').value.trim();
  task.priority = document.getElementById('edit-priority').value;
  editingId = null;
  closeModal('edit-modal');
  saveAndSync();
  render();
  showToast('Saved');
}

// ── Settings ────────────────────────────────────────────
function openSettings() {
  if (token) document.getElementById('settings-token').value = token;
  const gistDisplay = document.getElementById('gist-id-display');
  if (gistId) {
    gistDisplay.style.display = 'block';
    gistDisplay.textContent = `Gist ID: ${gistId}`;
  } else {
    gistDisplay.style.display = 'none';
  }
  openModal('settings-modal');
}

function saveTokenFromSettings() {
  const val = document.getElementById('settings-token').value.trim();
  if (!val) return;
  token = val;
  localStorage.setItem('remindly_token', token);
  document.getElementById('setup-banner').classList.remove('show');
  closeModal('settings-modal');
  setSyncStatus('syncing', 'syncing…');
  syncFromGist().then(() => showToast('Connected to GitHub!'));
}

function saveToken() {
  const val = document.getElementById('token-input').value.trim();
  if (!val) return;
  token = val;
  localStorage.setItem('remindly_token', token);
  document.getElementById('setup-banner').classList.remove('show');
  setSyncStatus('syncing', 'syncing…');
  syncFromGist().then(() => showToast('Connected to GitHub!'));
}

function exportData() {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'remindly-tasks.json'; a.click();
  URL.revokeObjectURL(url);
}

function clearAll() {
  if (!confirm('Delete ALL tasks? This cannot be undone.')) return;
  tasks = [];
  saveAndSync();
  render();
  closeModal('settings-modal');
  showToast('All tasks cleared');
}

// ── GitHub Gist Sync ────────────────────────────────────
function saveAndSync() {
  localStorage.setItem('remindly_tasks', JSON.stringify(tasks));
  if (!token) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(pushToGist, 1200); // debounce
}

async function syncFromGist() {
  if (!token) return;
  setSyncStatus('syncing', 'syncing…');
  try {
    // If no gist ID, find or create one
    if (!gistId) {
      gistId = await findOrCreateGist();
      localStorage.setItem('remindly_gist_id', gistId);
    }

    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    const content = data.files['remindly.json']?.content;
    if (content) {
      const remote = JSON.parse(content);
      // Merge: remote wins for existing IDs, keep local-only items
      const remoteMap = Object.fromEntries(remote.map(t => [t.id, t]));
      const localOnly = tasks.filter(t => !remoteMap[t.id]);
      tasks = [...remote, ...localOnly];
      localStorage.setItem('remindly_tasks', JSON.stringify(tasks));
      render();
    }
    setSyncStatus('synced', 'synced');
  } catch (e) {
    console.error('Sync error:', e);
    setSyncStatus('error', 'sync error');
  }
}

async function pushToGist() {
  if (!token) return;
  setSyncStatus('syncing', 'saving…');
  try {
    if (!gistId) {
      gistId = await findOrCreateGist();
      localStorage.setItem('remindly_gist_id', gistId);
    }
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ files: { 'remindly.json': { content: JSON.stringify(tasks, null, 2) } } })
    });
    setSyncStatus('synced', 'synced');
  } catch (e) {
    console.error('Push error:', e);
    setSyncStatus('error', 'sync error');
  }
}

async function findOrCreateGist() {
  // Search existing gists for remindly.json
  const res = await fetch('https://api.github.com/gists', {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
  });
  const gists = await res.json();
  const existing = gists.find(g => g.files['remindly.json']);
  if (existing) return existing.id;

  // Create new gist
  const create = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: 'Remindly tasks',
      public: false,
      files: { 'remindly.json': { content: JSON.stringify([], null, 2) } }
    })
  });
  const newGist = await create.json();
  return newGist.id;
}

// ── Helpers ─────────────────────────────────────────────
function setSyncStatus(state, label) {
  const dot = document.getElementById('sync-dot');
  const lbl = document.getElementById('sync-label');
  dot.className = '';
  dot.classList.add(state);
  lbl.textContent = label;
}

function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function esc(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ── Service Worker Registration ──────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ── Start ────────────────────────────────────────────────
init();
