/* ============================================================
   NuWatch – main.js
   Interactividad completa estilo Nubank
   ============================================================ */

'use strict';

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── TRACKING (LOCALSTORAGE) ──────────────────────────────── */
(function trackViews() {
  let views = parseInt(localStorage.getItem('nuwatch_views') || '0');
  localStorage.setItem('nuwatch_views', views + 1);
})();

function trackCartClick() {
  let clicks = parseInt(localStorage.getItem('nuwatch_clicks') || '0');
  localStorage.setItem('nuwatch_clicks', clicks + 1);
}

/* ── DEFAULT PRODUCTS ─────────────────────────────────────── */
const defaultProducts = [
  { id: '1', name: 'NuWatch Pro', category: 'luxury', price: '3999', desc: 'Acero inoxidable y cristal de zafiro.', img: 'img_pro.png' },
  { id: '2', name: 'NuWatch Ultra Sport', category: 'sport', price: '4599', desc: 'GPS de doble frecuencia y titanio.', img: 'img_sport.png' },
  { id: '3', name: 'NuWatch Elite', category: 'luxury', price: '5299', desc: 'Acabados en oro de 18k.', img: 'img_elite.png' },
  { id: '4', name: 'NuWatch Hero', category: 'pro', price: '3299', desc: 'Nuestra versión más ligera.', img: 'img_hero.png' }
];

let products = JSON.parse(localStorage.getItem('nuwatch_products')) || defaultProducts;

/* ============================================================
   1. RENDER PRODUCTS DYNAMICALLY
   ============================================================ */
function renderStoreProducts() {
  const grid = qs('#product-grid');
  if(!grid) return;
  grid.innerHTML = '';

  products.forEach(p => {
    const formatPrice = parseInt(p.price).toLocaleString('es-MX');
    const article = document.createElement('article');
    article.className = 'product-card';
    article.dataset.category = p.category;
    article.dataset.name = p.name;
    article.dataset.price = p.price;
    article.dataset.desc = p.desc;
    
    article.innerHTML = `
      <div class="card-image-wrap">
        <img src="${p.img}" alt="${p.name}" class="card-img" />
        <div class="card-glow"></div>
      </div>
      <div class="card-body">
        <div class="card-category">${p.category}</div>
        <h3 class="card-name">${p.name}</h3>
        <p class="card-desc">${p.desc}</p>
        <div class="card-features">
          <span class="feat-tag">🔥 Destacado</span>
        </div>
        <div class="card-footer">
          <div class="card-price">
            <span class="price-now">$${formatPrice}</span>
          </div>
          <button class="btn-card" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Agregar</button>
        </div>
      </div>
    `;
    grid.appendChild(article);
  });
  
  initFilter();
  initQuickView();
  initCartBindings();
}

/* ============================================================
   2. NAVBAR
   ============================================================ */
(function initNavbar() {
  const navbar = qs('#navbar');
  const hamburger = qs('#hamburger');
  const navLinks = qs('#nav-links');

  window.addEventListener('scroll', () => {
    if(navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navLinks.addEventListener('click', e => {
      if (e.target.classList.contains('nav-link')) {
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }
})();

/* ============================================================
   3. CATALOG FILTER
   ============================================================ */
function initFilter() {
  const pills = qsa('.pill', qs('#filter-pills'));
  const cards = qsa('.product-card', qs('#product-grid'));

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        if (match) {
          card.style.animation = 'none';
          card.style.display   = 'flex';
          requestAnimationFrame(() => { card.style.animation = 'fadeInUp 0.4s ease both'; });
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ============================================================
   4. QUICK VIEW
   ============================================================ */
function initQuickView() {
  const cards = qsa('.product-card');
  cards.forEach(card => {
    card.addEventListener('dblclick', () => {
      const name  = card.dataset.name;
      const price = `$${parseInt(card.dataset.price).toLocaleString('es-MX')}`;
      const desc  = card.dataset.desc;

      const overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:fadeInDown .3s ease both;`;
      overlay.innerHTML = `
        <div style="background:#FFFFFF;border:1px solid #EBEBF0;border-radius:24px;padding:2.5rem;max-width:420px;width:100%;text-align:center;position:relative;box-shadow:0 16px 40px rgba(0,0,0,0.12);">
          <button id="qv-close" style="position:absolute;top:1rem;right:1rem;background:#F5F5F7;border:none;color:#111111;width:36px;height:36px;border-radius:50%;font-size:1.1rem;cursor:pointer;transition:all 0.2s;">✕</button>
          <p style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:#8E8E93;margin-bottom:.5rem;">Vista rápida</p>
          <h2 style="font-size:1.8rem;font-weight:800;margin-bottom:.5rem;color:#111111;">${name}</h2>
          <p style="color:#3A3A3C;font-size:.9rem;margin-bottom:1.5rem;">${desc}</p>
          <p style="font-size:2rem;font-weight:900;color:#111111;margin-bottom:1.5rem;">${price}</p>
          <button id="qv-add" style="width:100%;padding:1rem;background:#820AD1;color:#fff;border:none;border-radius:9999px;font-size:1rem;font-weight:700;cursor:pointer;">Agregar al carrito</button>
        </div>`;
      
      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      qs('#qv-close', overlay).addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      qs('#qv-add', overlay).addEventListener('click', () => {
        close();
        card.querySelector('.btn-card')?.click();
      });
    });
  });
}

/* ============================================================
   5. CART
   ============================================================ */
let cartItems = [];
const WHATSAPP_NUMBER = "5215555555555";

function formatPrice(priceNum) { return '$' + parseInt(priceNum).toLocaleString('es-MX'); }
function showToast(name) {
  const toast = qs('#toast'), toastMsg = qs('#toast-msg');
  if(!toast) return;
  toastMsg.textContent = `"${name}" agregado al carrito`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateCart() {
  const countEl = qs('#cart-count');
  if(countEl) countEl.textContent = cartItems.length;
  
  const container = qs('#cart-items');
  const totalEl = qs('#cart-total-price');
  const btnCheckout = qs('#btn-checkout');
  if(!container) return;

  container.innerHTML = '';
  let total = 0;

  if (cartItems.length === 0) {
    container.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
    totalEl.textContent = '$0';
    btnCheckout.disabled = true;
    btnCheckout.style.opacity = '0.5';
    return;
  }

  btnCheckout.disabled = false;
  btnCheckout.style.opacity = '1';

  cartItems.forEach((item, index) => {
    total += parseInt(item.price);
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-info"><h4>${item.name}</h4><span class="cart-item-remove" data-index="${index}" style="cursor:pointer;">Eliminar</span></div>
      <div class="cart-item-price">${formatPrice(item.price)}</div>`;
    container.appendChild(el);
  });
  
  totalEl.textContent = formatPrice(total);
  qsa('.cart-item-remove', container).forEach(btn => {
    btn.addEventListener('click', (e) => {
      cartItems.splice(e.target.dataset.index, 1);
      updateCart();
    });
  });
}

function addToCart(id, name, price) {
  cartItems.push({ name, price });
  updateCart();
  trackCartClick();
  
  // Track por producto
  if (id) {
    let prodClicks = parseInt(localStorage.getItem('nuwatch_clicks_prod_' + id) || '0');
    localStorage.setItem('nuwatch_clicks_prod_' + id, prodClicks + 1);
  }

  const floatBtn = qs('#cart-float');
  if(floatBtn) { floatBtn.style.transform = 'scale(1.15)'; setTimeout(() => floatBtn.style.transform = '', 200); }
  showToast(name);
}

function initCartBindings() {
  qsa('.btn-card').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id, btn.dataset.name, btn.dataset.price));
  });
}

(function setupCartModal() {
  const floatBtn = qs('#cart-float');
  const modal = qs('#cart-modal');
  const closeBtn = qs('#cart-close');
  const btnCheckout = qs('#btn-checkout');
  
  if(floatBtn && modal) {
    floatBtn.addEventListener('click', () => modal.classList.add('show'));
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
  }

  if(btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      if (cartItems.length === 0) return;
      let total = 0, message = "Hola NuWatch, mi pedido:\n\n";
      cartItems.forEach((item, i) => {
        message += `${i + 1}. ${item.name} - ${formatPrice(item.price)}\n`;
        total += parseInt(item.price);
      });
      message += `\n*Total:* ${formatPrice(total)}\n\n¿Métodos de pago disponibles?`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    });
  }
  updateCart();
})();

/* ============================================================
   START APP
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderStoreProducts();
});
