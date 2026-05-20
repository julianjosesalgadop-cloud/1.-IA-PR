/* ============================================================
   NuWatch Admin – Full Backend Edition (Supabase + JWT)
   ============================================================ */

const API = '';  // same-origin en Vercel
let currentUser = null;
let products = [];

/* ── AUTH TOKEN ─────────────────────────────────────────── */
function getToken() { return sessionStorage.getItem('nw_token'); }
function setToken(t) { sessionStorage.setItem('nw_token', t); }
function clearSession() { sessionStorage.removeItem('nw_token'); }

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

/* ── API HELPERS ────────────────────────────────────────── */
async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: authHeaders(),
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

/* ── NAVIGATION ─────────────────────────────────────────── */
const sections = {
  stats: document.getElementById('section-stats'),
  products: document.getElementById('section-products'),
  users: document.getElementById('section-users'),
  settings: document.getElementById('section-settings'),
};

const navTitles = {
  stats: 'Panel de Control',
  products: 'Catálogo de Productos',
  users: 'Gestión de Usuarios',
  settings: 'Configuración',
};

document.querySelectorAll('.sidebar-nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const key = link.getAttribute('href').replace('#', '');
    showSection(key);
    document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

function showSection(key) {
  Object.values(sections).forEach(s => { if (s) s.style.display = 'none'; });
  if (sections[key]) sections[key].style.display = 'block';
  document.getElementById('section-title').textContent = navTitles[key] || '';
  if (key === 'stats') loadStats();
  if (key === 'products') loadProducts();
  if (key === 'users') loadUsers();
}

/* ── LOGIN ──────────────────────────────────────────────── */
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');

// Comprobar si ya hay sesión activa
if (getToken()) {
  // Validar que el token sigue siendo válido cargando stats
  apiFetch('/api/analytics')
    .then(data => showDashboard({ fromCache: true }))
    .catch(() => { clearSession(); });
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = 'Verificando…';
  errEl.style.color = '#555';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.style.color = '#FF3B30';
      errEl.textContent = data.error || 'Credenciales incorrectas.';
      return;
    }

    setToken(data.token);
    currentUser = data.user;
    showDashboard();
  } catch {
    errEl.style.color = '#FF3B30';
    errEl.textContent = 'Error de conexión. Verifica tu internet.';
  }
});

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'flex';

  if (!currentUser) {
    // Decode token payload
    try {
      const payload = JSON.parse(atob(getToken().split('.')[1]));
      currentUser = payload;
    } catch { clearSession(); return; }
  }

  document.getElementById('sidebar-user').textContent =
    `👤 ${currentUser.name || currentUser.email} (${currentUser.role})`;

  // Mostrar sección de usuarios solo a superadmin
  if (currentUser.role === 'superadmin') {
    document.getElementById('nav-users').style.display = 'flex';
  }

  showSection('stats');
}

document.getElementById('btn-logout').addEventListener('click', () => {
  clearSession();
  currentUser = null;
  dashboard.style.display = 'none';
  loginScreen.style.display = 'flex';
});

/* ── STATS ──────────────────────────────────────────────── */
async function loadStats() {
  try {
    const data = await apiFetch('/api/analytics');
    document.getElementById('stat-views').textContent = data.views ?? 0;
    document.getElementById('stat-clicks').textContent = data.cartClicks ?? 0;
    document.getElementById('stat-products').textContent = products.length || '–';

    const list = document.getElementById('product-stats-list');
    list.innerHTML = '';
    const stats = data.productStats || [];
    if (!stats.length) {
      list.innerHTML = '<li style="color:var(--nu-gray-600); padding:1rem 0;">Aún no hay interacciones registradas.</li>';
      return;
    }
    stats.forEach(ps => {
      const p = products.find(x => x.id === ps.product_id) || {};
      const firstImg = Array.isArray(p.img) ? p.img[0] : (p.img || '');
      const li = document.createElement('li');
      li.style.cssText = 'display:flex; justify-content:space-between; padding:1rem 0; border-bottom:1px solid #EBEBF0; align-items:center;';
      li.innerHTML = `
        <div style="display:flex; align-items:center; gap:1rem;">
          ${firstImg ? `<img src="${firstImg}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;background:#F5F5F7;">` : '<div style="width:48px;height:48px;background:#F5F5F7;border-radius:8px;"></div>'}
          <span style="font-weight:600;font-size:1.05rem;color:#111;">${p.name || 'Producto eliminado'}</span>
        </div>
        <div style="font-weight:700;color:var(--nu-primary);background:var(--nu-gray-100);padding:0.4rem 1.2rem;border-radius:999px;font-size:0.95rem;">
          ${ps.count} interacciones
        </div>`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

/* ── PRODUCTS ───────────────────────────────────────────── */
async function loadProducts() {
  try {
    products = await apiFetch('/api/products');
    renderProductTable();
  } catch (err) {
    console.error(err);
  }
}

function renderProductTable() {
  const tbody = document.getElementById('admin-product-list');
  tbody.innerHTML = '';
  document.getElementById('stat-products').textContent = products.length;

  products.forEach(p => {
    const firstImg = Array.isArray(p.img) ? p.img[0] : p.img;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${firstImg}" alt="${p.name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;"></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.category}</td>
      <td>$${parseInt(p.price).toLocaleString('es-MX')}</td>
      <td><strong style="color:var(--nu-primary);">${p.cart_clicks || 0}</strong></td>
      <td>
        <button class="action-btn edit-btn" onclick="openEditProduct('${p.id}')">Editar</button>
        <button class="action-btn del-btn" onclick="deleteProduct('${p.id}')">Borrar</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// Modal producto
const productModal = document.getElementById('product-modal');
document.getElementById('btn-new-product').addEventListener('click', () => {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('modal-title').textContent = 'Agregar Producto';
  productModal.classList.add('show');
});
document.getElementById('btn-close-modal').addEventListener('click', () => productModal.classList.remove('show'));

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const payload = {
    name: document.getElementById('prod-name').value,
    category: document.getElementById('prod-category').value,
    price: document.getElementById('prod-price').value,
    desc: document.getElementById('prod-desc').value,
    img: document.getElementById('prod-img').value.split(',').map(s => s.trim()),
    features: document.getElementById('prod-features').value.split(',').map(s => s.trim()),
  };

  try {
    if (id) {
      await apiFetch('/api/products', { method: 'PUT', body: { id, ...payload } });
    } else {
      await apiFetch('/api/products', { method: 'POST', body: payload });
    }
    productModal.classList.remove('show');
    await loadProducts();
  } catch (err) {
    alert(err.message);
  }
});

window.openEditProduct = (id) => {
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.name;
  document.getElementById('prod-category').value = p.category;
  document.getElementById('prod-price').value = p.price;
  document.getElementById('prod-desc').value = p.desc;
  document.getElementById('prod-img').value = Array.isArray(p.img) ? p.img.join(', ') : p.img;
  document.getElementById('prod-features').value = Array.isArray(p.features) ? p.features.join(', ') : '';
  document.getElementById('modal-title').textContent = 'Editar Producto';
  productModal.classList.add('show');
};

window.deleteProduct = async (id) => {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await apiFetch('/api/products', { method: 'DELETE', body: { id } });
    await loadProducts();
  } catch (err) { alert(err.message); }
};

/* ── USERS (superadmin only) ────────────────────────────── */
let adminUsers = [];

async function loadUsers() {
  try {
    adminUsers = await apiFetch('/api/users');
    renderUserTable();
  } catch (err) { console.error(err); }
}

function renderUserTable() {
  const tbody = document.getElementById('admin-user-list');
  tbody.innerHTML = '';
  adminUsers.forEach(u => {
    const lastLogin = u.last_login ? new Date(u.last_login).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Nunca';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td><span style="background:var(--nu-gray-100);padding:0.3rem 0.7rem;border-radius:999px;font-size:0.8rem;font-weight:600;">${u.role}</span></td>
      <td><span style="color:${u.is_active ? '#34C759' : '#FF3B30'};font-weight:700;">${u.is_active ? '● Activo' : '● Inactivo'}</span></td>
      <td style="font-size:0.85rem;color:var(--nu-gray-600);">${lastLogin}</td>
      <td>
        <button class="action-btn edit-btn" onclick="openEditUser('${u.id}')">Editar</button>
        <button class="action-btn del-btn" onclick="deleteUser('${u.id}')">Borrar</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

const userModal = document.getElementById('user-modal');
document.getElementById('btn-new-user').addEventListener('click', () => {
  document.getElementById('user-form').reset();
  document.getElementById('user-id').value = '';
  document.getElementById('user-modal-title').textContent = 'Nuevo Administrador';
  document.getElementById('user-pass-group').querySelector('input').required = true;
  document.getElementById('user-active-group').style.display = 'none';
  userModal.classList.add('show');
});
document.getElementById('btn-close-user-modal').addEventListener('click', () => userModal.classList.remove('show'));

document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('user-id').value;
  const payload = {
    name: document.getElementById('user-name').value,
    email: document.getElementById('user-email').value,
    role: document.getElementById('user-role').value,
  };
  const newPass = document.getElementById('user-password').value;
  if (newPass) payload.newPassword = newPass;
  if (id) {
    payload.id = id;
    payload.is_active = document.getElementById('user-active').checked;
  }

  try {
    if (id) {
      await apiFetch('/api/users', { method: 'PUT', body: payload });
    } else {
      if (!newPass) { alert('La contraseña es requerida para nuevos usuarios.'); return; }
      await apiFetch('/api/users', { method: 'POST', body: { ...payload, password: newPass } });
    }
    userModal.classList.remove('show');
    await loadUsers();
  } catch (err) { alert(err.message); }
});

window.openEditUser = (id) => {
  const u = adminUsers.find(x => x.id === id);
  if (!u) return;
  document.getElementById('user-id').value = u.id;
  document.getElementById('user-name').value = u.name;
  document.getElementById('user-email').value = u.email;
  document.getElementById('user-role').value = u.role;
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').required = false;
  document.getElementById('user-active').checked = u.is_active;
  document.getElementById('user-active-group').style.display = 'block';
  document.getElementById('user-modal-title').textContent = 'Editar Usuario';
  userModal.classList.add('show');
};

window.deleteUser = async (id) => {
  if (!confirm('¿Eliminar este usuario administrador?')) return;
  try {
    await apiFetch('/api/users', { method: 'DELETE', body: { id } });
    await loadUsers();
  } catch (err) { alert(err.message); }
};

/* ── SETTINGS – Change own password ────────────────────── */
document.getElementById('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPass = document.getElementById('new-password').value;
  const confirmPass = document.getElementById('confirm-password').value;
  const msg = document.getElementById('password-msg');

  if (newPass !== confirmPass) {
    msg.style.color = '#FF3B30';
    msg.textContent = 'Las contraseñas no coinciden.';
    return;
  }

  try {
    await apiFetch('/api/users', {
      method: 'PUT',
      body: { id: currentUser.id, newPassword: newPass },
    });
    msg.style.color = '#34C759';
    msg.textContent = 'Contraseña actualizada. Vuelve a iniciar sesión.';
    document.getElementById('password-form').reset();
    setTimeout(() => {
      clearSession();
      location.reload();
    }, 2000);
  } catch (err) {
    msg.style.color = '#FF3B30';
    msg.textContent = err.message;
  }
});
