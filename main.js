/* ============================================================
   NuWatch – main.js
   Interactividad completa estilo Nubank
   ============================================================ */

'use strict';

/* ── Helpers ──────────────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   1. NAVBAR – scroll shrink + hamburger menu
   ============================================================ */
(function initNavbar() {
  const navbar    = qs('#navbar');
  const hamburger = qs('#hamburger');
  const navLinks  = qs('#nav-links');

  // Shrink on scroll
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Hamburger toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    navLinks.addEventListener('click', e => {
      if (e.target.classList.contains('nav-link')) {
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }
})();

/* ============================================================
   2. SCROLL REVEAL – IntersectionObserver
   ============================================================ */
(function initScrollReveal() {
  // Mark elements to animate
  const targets = qsa([
    '.product-card',
    '.service-card',
    '.testimonial-card',
    '.section-header',
    '.stat-item',
    '.comparison-table-wrap',
    '.cta-content',
  ].join(','));

  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger delay for grid children
          const delay = entry.target.closest('.product-grid, .services-grid, .testimonials-grid')
            ? Array.from(entry.target.parentElement.children).indexOf(entry.target) * 80
            : 0;
          setTimeout(() => entry.target.classList.add('visible'), delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach(el => observer.observe(el));
})();

/* ============================================================
   3. CATALOG FILTER – pill buttons
   ============================================================ */
(function initFilter() {
  const pills = qsa('.pill', qs('#filter-pills'));
  const cards = qsa('.product-card', qs('#product-grid'));

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      // Active state
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;

        if (match) {
          card.style.animation = 'none';
          card.style.display   = 'flex';
          // Force reflow then animate
          requestAnimationFrame(() => {
            card.style.animation = 'fadeInUp 0.4s ease both';
          });
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
})();

/* ============================================================
   4. CART – logic and WhatsApp integration
   ============================================================ */
(function initCart() {
  const cartItems = [];
  const WHATSAPP_NUMBER = "573145342947"; // Example Mexican number

  const cartCountEl = qs('#cart-count');
  const cartModal = qs('#cart-modal');
  const cartFloat = qs('#cart-float');
  const btnClose = qs('#cart-close');
  const itemsContainer = qs('#cart-items');
  const totalPriceEl = qs('#cart-total-price');
  const btnCheckout = qs('#btn-checkout');
  
  const toast = qs('#toast');
  const toastMsg = qs('#toast-msg');
  let toastTimer = null;

  function showToast(name) {
    toastMsg.textContent = `"${name}" agregado al carrito`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function formatPrice(priceNum) {
    return '$' + priceNum.toLocaleString('es-MX');
  }

  function parsePrice(priceStr) {
    return parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  }

  function renderCart() {
    itemsContainer.innerHTML = '';
    let total = 0;

    if (cartItems.length === 0) {
      itemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
      totalPriceEl.textContent = '$0';
      btnCheckout.disabled = true;
      btnCheckout.style.opacity = '0.5';
      return;
    }

    btnCheckout.disabled = false;
    btnCheckout.style.opacity = '1';

    cartItems.forEach((item, index) => {
      total += item.price;
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <span class="cart-item-remove" data-index="${index}" style="cursor:pointer;">Eliminar</span>
        </div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      `;
      itemsContainer.appendChild(el);
    });

    totalPriceEl.textContent = formatPrice(total);

    // Add remove listeners
    qsa('.cart-item-remove', itemsContainer).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        cartItems.splice(idx, 1);
        updateCart();
      });
    });
  }

  function updateCart() {
    cartCountEl.textContent = cartItems.length;
    renderCart();
  }

  function addToCart(name, priceStr) {
    const price = parsePrice(priceStr);
    cartItems.push({ name, price });
    updateCart();

    // Bounce animation
    cartFloat.style.transform = 'scale(1.15)';
    setTimeout(() => (cartFloat.style.transform = ''), 200);

    showToast(name);
  }

  // Bind add buttons
  qsa('.btn-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      const name = card.querySelector('.card-name').textContent;
      const priceStr = card.querySelector('.price-now').textContent;
      addToCart(name, priceStr);
    });
  });

  // Modal interactions
  cartFloat.addEventListener('click', () => {
    cartModal.classList.add('show');
  });

  btnClose.addEventListener('click', () => {
    cartModal.classList.remove('show');
  });

  cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) cartModal.classList.remove('show');
  });

  // WhatsApp Checkout
  btnCheckout.addEventListener('click', () => {
    if (cartItems.length === 0) return;

    let total = 0;
    let message = "Hola NuWatch, me gustaría realizar el siguiente pedido:\n\n";

    cartItems.forEach((item, i) => {
      message += `${i + 1}. ${item.name} - ${formatPrice(item.price)}\n`;
      total += item.price;
    });

    message += `\n*Total:* ${formatPrice(total)}\n\n`;
    message += "¿Cuáles son los métodos de pago disponibles?";

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;
    
    window.open(whatsappUrl, '_blank');
  });

  // Initial render
  updateCart();
})();

/* ============================================================
   5. CTA FORM – email validation + success state
   ============================================================ */
(function initCTAForm() {
  const form  = qs('#cta-form');
  const input = qs('#cta-email');
  const btn   = qs('#btn-cta-submit');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const email = input.value.trim();
    if (!email) return;

    // Success state
    btn.textContent  = '✅ ¡Listo!';
    btn.style.background = 'linear-gradient(135deg, #00C853, #00E676)';
    btn.disabled = true;
    input.value  = '';

    setTimeout(() => {
      btn.textContent  = 'Quiero el mío';
      btn.style.background = '';
      btn.disabled = false;
    }, 3500);
  });
})();

/* ============================================================
   6. HERO STATS – animated number counter
   ============================================================ */
(function initCounters() {
  const stats = [
    { el: null, text: '50K+', target: 50000, suffix: 'K+', divisor: 1000 },
    { el: null, text: '4.9★', fixed: '4.9★' },
    { el: null, text: '24/7', fixed: '24/7' },
  ];

  const statNumbers = qsa('.stat-number');
  statNumbers.forEach((el, i) => {
    if (stats[i]) stats[i].el = el;
  });

  function animateCounter(el, target, suffix, divisor, duration = 1200) {
    const start     = performance.now();
    const startVal  = 0;

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const val      = Math.round(startVal + ease * target);
      el.textContent = divisor
        ? `${Math.round(val / divisor)}${suffix}`
        : `${val}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  // Trigger once the hero stats come into view
  const heroSection = qs('#hero');
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animateCounter(stats[0].el, 50000, 'K+', 1000);
      observer.disconnect();
    }
  }, { threshold: 0.5 });

  if (heroSection) observer.observe(heroSection);
})();

/* ============================================================
   7. SMOOTH ACTIVE NAV HIGHLIGHT on scroll
   ============================================================ */
(function initActiveNav() {
  const sections = qsa('section[id]');
  const links    = qsa('.nav-link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(link => {
          link.classList.toggle(
            'active-link',
            link.getAttribute('href') === `#${entry.target.id}`
          );
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
})();

/* ============================================================
   8. PRODUCT CARD – quick-view on double click
   ============================================================ */
(function initQuickView() {
  const cards = qsa('.product-card');

  cards.forEach(card => {
    card.addEventListener('dblclick', () => {
      const name  = card.querySelector('.card-name')?.textContent || '';
      const price = card.querySelector('.price-now')?.textContent || '';
      const desc  = card.querySelector('.card-desc')?.textContent || '';

      // Simple modal-like overlay
      const overlay = document.createElement('div');
      overlay.id = 'quick-view-overlay';
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:3000;
        background:rgba(0,0,0,0.5);
        backdrop-filter:blur(8px);
        display:flex;align-items:center;justify-content:center;
        padding:1.5rem;
        animation:fadeInDown .3s ease both;
      `;

      overlay.innerHTML = `
        <div style="
          background:#FFFFFF;border:1px solid #EBEBF0;
          border-radius:24px;padding:2.5rem;max-width:420px;width:100%;
          text-align:center;position:relative;
          box-shadow:0 16px 40px rgba(0,0,0,0.12);
        ">
          <button id="qv-close" style="
            position:absolute;top:1rem;right:1rem;
            background:#F5F5F7;border:none;
            color:#111111;width:36px;height:36px;border-radius:50%;
            font-size:1.1rem;cursor:pointer;transition:all 0.2s;
          ">✕</button>
          <p style="font-size:.75rem;font-weight:700;text-transform:uppercase;
            letter-spacing:.1em;color:#8E8E93;margin-bottom:.5rem;">Vista rápida</p>
          <h2 style="font-size:1.8rem;font-weight:800;margin-bottom:.5rem;color:#111111;">${name}</h2>
          <p style="color:#3A3A3C;font-size:.9rem;margin-bottom:1.5rem;">${desc}</p>
          <p style="font-size:2rem;font-weight:900;
            color:#111111;margin-bottom:1.5rem;">${price}</p>
          <button id="qv-add" style="
            width:100%;padding:1rem;
            background:#820AD1;
            color:#fff;border:none;border-radius:9999px;
            font-size:1rem;font-weight:700;cursor:pointer;
            box-shadow:0 8px 32px rgba(130, 10, 209, 0.15);
          ">Agregar al carrito</button>
        </div>
      `;

      document.body.appendChild(overlay);

      const close = () => overlay.remove();
      qs('#qv-close', overlay).addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      qs('#qv-add', overlay).addEventListener('click', () => {
        close();
        // Simulate add
        const addBtn = card.querySelector('.btn-card');
        if (addBtn) addBtn.click();
      });
    });
  });
})();

/* ============================================================
   9. COMPARISON TABLE – highlight column on hover
   ============================================================ */
(function initTableHighlight() {
  const table = qs('#comparison-table');
  if (!table) return;

  const cells = qsa('td, th', table);

  cells.forEach(cell => {
    cell.addEventListener('mouseenter', () => {
      const col = cell.cellIndex;
      qsa('tr', table).forEach(row => {
        const c = row.cells[col];
        if (c && !c.classList.contains('highlight-col')) {
          c.style.background = 'rgba(138,5,190,0.04)';
        }
      });
    });
    cell.addEventListener('mouseleave', () => {
      qsa('tr', table).forEach(row => {
        const c = row.cells[cell.cellIndex];
        if (c && !c.classList.contains('highlight-col')) {
          c.style.background = '';
        }
      });
    });
  });
})();

/* ============================================================
   10. PARALLAX – subtle hero orb movement
   ============================================================ */
(function initParallax() {
  const orb1 = qs('.orb-1');
  const orb2 = qs('.orb-2');
  if (!orb1 || !orb2) return;

  window.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - 0.5) * 40;
    const y = (e.clientY / window.innerHeight - 0.5) * 40;
    orb1.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
    orb2.style.transform = `translate(${-x * 0.4}px, ${-y * 0.4}px)`;
  }, { passive: true });
})();

console.log('%c⌚ NuWatch loaded!', 'color:#8A05BE;font-size:1.2rem;font-weight:bold;');
