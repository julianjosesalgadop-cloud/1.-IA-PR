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
  { id: '1', name: 'NuWatch Pro', category: 'luxury', price: '3999', desc: 'Acero inoxidable y cristal de zafiro.', img: ['images/products/pro/1.png', 'images/products/pro/2.png'], features: ['❤️ ECG', '💳 NFC', '🏊 IP68'] },
  { id: '2', name: 'NuWatch Ultra Sport', category: 'sport', price: '4599', desc: 'GPS de doble frecuencia y titanio.', img: ['images/products/sport/1.png', 'images/products/sport/2.png'], features: ['🏃 GPS', '💧 SpO2', '🌡️ Temp.'] },
  { id: '3', name: 'NuWatch Elite', category: 'luxury', price: '5299', desc: 'Acabados en oro de 18k.', img: ['images/products/elite/1.png', 'images/products/elite/2.png'], features: ['💎 Premium', '⏱️ Garantía 2A'] },
  { id: '4', name: 'NuWatch Hero', category: 'pro', price: '3299', desc: 'Nuestra versión más ligera.', img: ['images/products/hero/1.png', 'images/products/hero/2.png'], features: ['📱 App', '❤️ Salud'] }
];

let products = JSON.parse(localStorage.getItem('nuwatch_products')) || defaultProducts;
if (products.length > 0 && typeof products[0].features === 'undefined') {
  // Migración: borrar caché antigua
  localStorage.removeItem('nuwatch_products');
  products = defaultProducts;
}

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
    
    const images = Array.isArray(p.img) ? p.img : [p.img];
    
    // Generar las imágenes superpuestas para el carrusel
    const imgsHtml = images.map((img, i) => 
      `<img src="${img}" alt="${p.name}" class="card-img carousel-img" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; opacity:${i === 0 ? 1 : 0}; transition: opacity 0.5s ease-in-out;" />`
    ).join('');

    article.innerHTML = `
      <div class="card-image-wrap carousel-container" style="position:relative; overflow:hidden; padding-top:100%;">
        ${imgsHtml}
        <div class="card-glow"></div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.name}</h3>
        <p class="card-desc">${p.desc}</p>
        <div class="card-features">
          ${Array.isArray(p.features) ? p.features.map(f => `<span>${f}</span>`).join('') : ''}
        </div>
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
  initCarousels();
}

function initCarousels() {
  const containers = qsa('.carousel-container');
  containers.forEach(container => {
    const images = container.querySelectorAll('.carousel-img');
    if (images.length > 1) {
      let currentIndex = 0;
      setInterval(() => {
        images[currentIndex].style.opacity = '0';
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].style.opacity = '1';
      }, 3000); // Cambiar cada 3 segundos
    }
  });
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
   4. QUICK VIEW (COLLAGE)
   ============================================================ */
function initQuickView() {
  const cards = qsa('.product-card');
  cards.forEach(card => {
    // Escuchar el clic sobre la imagen del reloj para abrir el detalle
    const imgWrap = qs('.card-image-wrap', card);
    if(imgWrap) {
      imgWrap.style.cursor = 'pointer';
      imgWrap.addEventListener('click', () => {
        const id = qs('.btn-card', card).dataset.id;
        const p = products.find(prod => prod.id === id);
        if(!p) return;
        
        const formatPrice = `$${parseInt(p.price).toLocaleString('es-MX')}`;
        const images = Array.isArray(p.img) ? p.img : [p.img];

        // Crear grilla del collage según cuántas imágenes tenga
        let collageHtml = '';
        if (images.length === 1) {
           collageHtml = `<img src="${images[0]}" style="width:100%; height:100%; object-fit:cover; border-radius:16px;">`;
        } else {
           collageHtml = `<div style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap:10px; height:100%;">
             <img src="${images[0]}" style="width:100%; height:100%; object-fit:cover; border-radius:16px; grid-column: span 2; grid-row: span 1;">
             ${images.slice(1,3).map(i => `<img src="${i}" style="width:100%; height:100%; object-fit:cover; border-radius:16px;">`).join('')}
           </div>`;
        }

        const overlay = document.createElement('div');
        overlay.style.cssText = `position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:2rem;animation:fadeInDown .3s ease both;`;
        
        overlay.innerHTML = `
          <div style="background:var(--nu-white);border-radius:24px;width:100%;max-width:900px;display:flex;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.2);position:relative;flex-direction:row;">
            <button id="qv-close" style="position:absolute;top:1.5rem;right:1.5rem;background:var(--nu-gray-100);border:none;color:#111111;width:40px;height:40px;border-radius:50%;font-size:1.2rem;cursor:pointer;z-index:10;transition:all 0.2s;">✕</button>
            
            <div style="flex:1; background:var(--nu-gray-100); padding:1rem; min-height:400px;">
              ${collageHtml}
            </div>
            
            <div style="flex:1; padding:3rem; display:flex; flex-direction:column; justify-content:center;">
              <p style="font-size:.85rem;font-weight:700;text-transform:uppercase;color:var(--nu-primary);margin-bottom:.5rem;">${p.category} Series</p>
              <h2 style="font-size:2.5rem;font-weight:900;line-height:1.1;margin-bottom:1rem;color:var(--nu-dark);">${p.name}</h2>
              <p style="color:var(--nu-gray-600);font-size:1.05rem;line-height:1.5;margin-bottom:2rem;">${p.desc}</p>
              
              <div style="margin-bottom: 2rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
                 ${Array.isArray(p.features) ? p.features.map(f => `<span style="background:var(--nu-gray-100); padding:0.4rem 0.8rem; border-radius:999px; font-size:0.8rem; font-weight:600;">${f}</span>`).join('') : ''}
              </div>
              
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:auto;">
                <p style="font-size:2rem;font-weight:900;color:var(--nu-dark);">${formatPrice}</p>
                <button id="qv-add" style="padding:1rem 2rem;background:var(--nu-primary);color:#fff;border:none;border-radius:9999px;font-size:1.05rem;font-weight:700;cursor:pointer;transition:transform 0.2s;">Añadir al carrito</button>
              </div>
            </div>
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
    }
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
