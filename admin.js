/* ============================================================
   NuWatch Admin - Logic (LocalStorage)
   ============================================================ */

const defaultProducts = [
  { id: '1', name: 'NuWatch Pro', category: 'pro', price: '3999', desc: 'Acero inoxidable y cristal de zafiro.', img: 'img_pro.png' },
  { id: '2', name: 'NuWatch Ultra Sport', category: 'sport', price: '4599', desc: 'GPS de doble frecuencia y titanio.', img: 'img_sport.png' },
  { id: '3', name: 'NuWatch Elite', category: 'classic', price: '5299', desc: 'Acabados en oro de 18k.', img: 'img_elite.png' },
  { id: '4', name: 'NuWatch Hero', category: 'pro', price: '3299', desc: 'Nuestra versión más ligera.', img: 'img_hero.png' }
];

let products = JSON.parse(localStorage.getItem('nuwatch_products')) || defaultProducts;

// Setup Login
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const btnLogout = document.getElementById('btn-logout');

// Check session
if (sessionStorage.getItem('nuwatch_admin_logged')) {
  showDashboard();
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  
  const storedPass = localStorage.getItem('nuwatch_admin_password') || 'admin123';

  if (user === 'admin' && pass === storedPass) {
    sessionStorage.setItem('nuwatch_admin_logged', 'true');
    showDashboard();
  } else {
    document.getElementById('login-error').textContent = 'Credenciales incorrectas.';
  }
});

btnLogout.addEventListener('click', () => {
  sessionStorage.removeItem('nuwatch_admin_logged');
  dashboard.style.display = 'none';
  loginScreen.style.display = 'flex';
});

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'flex';
  renderStats();
  renderProducts();
}

// Navigation
document.querySelectorAll('.sidebar-nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
    document.querySelector(link.getAttribute('href').replace('#', '#section-')).style.display = 'block';
  });
});

// Stats Logic
function renderStats() {
  const views = localStorage.getItem('nuwatch_views') || 0;
  const clicks = localStorage.getItem('nuwatch_clicks') || 0;
  
  document.getElementById('stat-views').textContent = views;
  document.getElementById('stat-clicks').textContent = clicks;
  document.getElementById('stat-products').textContent = products.length;
}

document.getElementById('btn-reset-stats').addEventListener('click', () => {
  if(confirm('¿Estás seguro de reiniciar a 0 las estadísticas?')) {
    localStorage.setItem('nuwatch_views', 0);
    localStorage.setItem('nuwatch_clicks', 0);
    renderStats();
  }
});

// Product CRUD
const tbody = document.getElementById('admin-product-list');

function renderProducts() {
  tbody.innerHTML = '';
  products.forEach(p => {
    const pClicks = localStorage.getItem('nuwatch_clicks_prod_' + p.id) || 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.img}" alt="${p.name}"></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.category}</td>
      <td>$${parseInt(p.price).toLocaleString('es-MX')}</td>
      <td><strong style="color:var(--nu-primary);">${pClicks}</strong> veces</td>
      <td>
        <button class="action-btn edit-btn" onclick="editProduct('${p.id}')">Editar</button>
        <button class="action-btn del-btn" onclick="deleteProduct('${p.id}')">Borrar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  localStorage.setItem('nuwatch_products', JSON.stringify(products));
  document.getElementById('stat-products').textContent = products.length;
}

// Modal Logic
const modal = document.getElementById('product-modal');
const form = document.getElementById('product-form');

document.getElementById('btn-new-product').addEventListener('click', () => {
  form.reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('modal-title').textContent = 'Agregar Producto';
  modal.classList.add('show');
});

document.getElementById('btn-close-modal').addEventListener('click', () => {
  modal.classList.remove('show');
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const pData = {
    id: id || Date.now().toString(),
    name: document.getElementById('prod-name').value,
    category: document.getElementById('prod-category').value,
    price: document.getElementById('prod-price').value,
    desc: document.getElementById('prod-desc').value,
    img: document.getElementById('prod-img').value
  };

  if (id) {
    const idx = products.findIndex(p => p.id === id);
    products[idx] = pData;
  } else {
    products.push(pData);
  }

  renderProducts();
  modal.classList.remove('show');
});

window.editProduct = (id) => {
  const p = products.find(p => p.id === id);
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.name;
  document.getElementById('prod-category').value = p.category;
  document.getElementById('prod-price').value = p.price;
  document.getElementById('prod-desc').value = p.desc;
  document.getElementById('prod-img').value = p.img;
  
  document.getElementById('modal-title').textContent = 'Editar Producto';
  modal.classList.add('show');
};

window.deleteProduct = (id) => {
  if(confirm('¿Eliminar este reloj?')) {
    products = products.filter(p => p.id !== id);
    renderProducts();
  }
};

// Password Change Logic
const passForm = document.getElementById('password-form');
if(passForm) {
  passForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const msg = document.getElementById('password-msg');

    if(newPass !== confirmPass) {
      msg.style.color = '#FF3B30';
      msg.textContent = 'Las contraseñas no coinciden.';
      return;
    }

    if(newPass.length < 6) {
      msg.style.color = '#FF3B30';
      msg.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    localStorage.setItem('nuwatch_admin_password', newPass);
    msg.style.color = '#34C759';
    msg.textContent = 'Contraseña actualizada exitosamente.';
    passForm.reset();
  });
}
