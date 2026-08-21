/* Wood & Grains Furniture — shared site JavaScript
   Products live in Supabase — edit them via /admin.html.
   No cart, no wishlist, no checkout: every product links straight to a WhatsApp enquiry. */

const WHATSAPP_NUMBER = '9746841327';
let PRODUCTS = [];

const formatPrice = n => '₹' + Number(n).toLocaleString('en-IN');

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function openWhatsApp(message) {
  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer'
  );
}

function enquireProduct(p) {
  openWhatsApp(
`Hello WoodGrains Furniture,

I'm interested in the following product:

Product: ${p.name}
Price: ${formatPrice(p.price)}

Could you please share more details about this product, including availability and delivery information?

Thank you!`  );
}

// Look a product up by id and send the WhatsApp enquiry.
// Used by delegated click handlers so we never have to embed product data
// inside HTML attributes.
function enquireProductById(id) {
  const p = PRODUCTS.find(x => String(x.id) === String(id));

  if (p) {
    enquireProduct(p);
  }
}

async function loadProducts() {
  if (PRODUCTS.length) return PRODUCTS;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const data = await res.json();

    PRODUCTS = Array.isArray(data)
      ? data.map(p => ({
          ...p,
          image: p.image_url
        }))
      : [];

  } catch (e) {
    console.error('Could not load products from Supabase', e);
    PRODUCTS = [];
  }

  return PRODUCTS;
}

function showToast(message, icon = 'check') {
  let c = document.querySelector('.toast-container');

  if (!c) {
    c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
  }

  const t = document.createElement('div');

  t.className = 'toast';

  t.innerHTML = `
    <span>${icon === 'redirect' ? '↗' : '✓'}</span>
    <span>${escapeHtml(message)}</span>
  `;

  c.appendChild(t);

  setTimeout(() => t.remove(), 2900);
}

function initNavbar() {
  const h = document.querySelector('.hamburger');
  const m = document.querySelector('.mobile-nav');

  if (h && m) {
    h.addEventListener('click', () => {
      const o = m.classList.toggle('open');

      h.setAttribute('aria-expanded', o);
    });

    m.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        m.classList.remove('open');
      });
    });
  }

  const path = location.pathname.split('/').pop() || 'index.html';

  document
    .querySelectorAll('.nav-links a,.mobile-nav a')
    .forEach(a => {
      const p = (a.getAttribute('href') || '')
        .split('?')[0]
        .split('#')[0];

      if (p === path) {
        a.classList.add('active');
      }
    });

  const b = document.querySelector('.search-btn');
  const o = document.querySelector('.search-overlay');
  const cl = document.querySelector('.search-close');
  const inp = document.querySelector('.search-box input');

  if (b && o) {
    b.addEventListener('click', () => {
      o.classList.add('open');

      setTimeout(() => {
        inp?.focus();
      }, 100);
    });

    cl?.addEventListener('click', () => {
      o.classList.remove('open');
    });

    o.addEventListener('click', e => {
      if (e.target === o) {
        o.classList.remove('open');
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        o.classList.remove('open');
      }

      if (
        e.key === 'Enter' &&
        document.activeElement === inp &&
        inp.value.trim()
      ) {
        location.href = `shop.html?q=${encodeURIComponent(inp.value.trim())}`;
      }
    });
  }
}


/* ============================================================
   PRODUCT CARD
   ============================================================ */

function buildProductCard(p) {
  const name = escapeHtml(p.name || 'Unnamed product');

  const img = escapeHtml(
  p.image ||
  p.image_url ||
  ''
);

  const price =
    p.price === null ||
    p.price === undefined ||
    p.price === ''
      ? 'Price on request'
      : formatPrice(p.price);

  return `
    <article class="product-card">

      <!-- Product Image -->
      <a
        href="product.html?id=${encodeURIComponent(p.id)}"
        class="product-img-wrap"
      >
        <img
          src="${img}"
          alt="${name}"
          loading="lazy"
          onerror="this.style.display='none'"
        >
      </a>

      <!-- Product Information -->
      <div class="product-info">

        <a
          href="product.html?id=${encodeURIComponent(p.id)}"
          class="product-name-link"
        >
          <span class="product-name">
            ${name}
          </span>
        </a>

        <p class="product-price">
          ${price}
        </p>

      </div>

    </article>
  `;
}

/* ============================================================
   WHATSAPP BUTTON HANDLER
   ============================================================ */

// Single delegated listener for every
// "Enquire on WhatsApp" button rendered anywhere on the site.
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-enquire-id]');

  if (btn) {
    enquireProductById(btn.dataset.enquireId);
  }
});


/* ============================================================
   CATEGORIES
   ============================================================ */

const CATEGORY_IDS = [
  'living-room',
  'bedroom',
  'dining-room',
  'office',
  'storage'
];

function updateCategoryCounts() {
  const countAll = document.getElementById('count-all');

  if (countAll) {
    countAll.textContent = PRODUCTS.length;
  }

  CATEGORY_IDS.forEach(cat => {
    const el = document.getElementById(`count-${cat}`);

    if (el) {
      el.textContent = PRODUCTS.filter(
        p => p.category === cat
      ).length;
    }
  });
}


/* ============================================================
   SHOP PAGE
   ============================================================ */

async function initShopPage() {
  const g = document.getElementById('products-grid');

  if (!g) return;

  await loadProducts();

  updateCategoryCounts();

  let cat = 'all';
  let max = 102000;

  const q = new URLSearchParams(location.search);

  const wanted = q.get('cat');

  const search = (q.get('q') || '').toLowerCase();

  if (
    wanted &&
    ['all', ...PRODUCTS.map(p => p.category)].includes(wanted)
  ) {
    cat = wanted;

    document
      .querySelectorAll('.cat-filter-item')
      .forEach(x => {
        x.classList.toggle(
          'active',
          x.dataset.cat === cat
        );
      });
  }

  function render() {
    const a = PRODUCTS.filter(p =>
      (cat === 'all' || p.category === cat) &&
      p.price <= max &&
      (
        !search ||
        `${p.name} ${p.category}`
          .toLowerCase()
          .includes(search)
      )
    );

    const c = document.getElementById('products-count');

    if (c) {
      c.innerHTML =
        `Showing <strong>${a.length}</strong> of ` +
        `<strong>${PRODUCTS.length}</strong> furniture`;
    }

    g.innerHTML = a.length
      ? a.map(buildProductCard).join('')
      : `
        <div
          style="
            grid-column:1/-1;
            text-align:center;
            padding:60px;
            color:var(--text-muted)
          "
        >
          No products match your filters.
        </div>
      `;
  }

  document
    .querySelectorAll('.cat-filter-item')
    .forEach(x => {
      x.addEventListener('click', () => {

        document
          .querySelectorAll('.cat-filter-item')
          .forEach(i => {
            i.classList.remove('active');
          });

        x.classList.add('active');

        cat = x.dataset.cat;

        render();
      });
    });

  const r = document.getElementById('price-range');

  r?.addEventListener('input', () => {
    max = +r.value;

    const v = document.getElementById('price-max-val');
    const f = document.getElementById('range-fill');

    if (v) {
      v.textContent = formatPrice(max);
    }

    if (f) {
      f.style.width =
        `${((max - 5000) / 97000) * 100}%`;
    }

    render();
  });

  render();
}


/* ============================================================
   PRODUCT GALLERY
   ============================================================ */

function buildGallery(p) {
  const images = [
    p.image,
    p.image_2,
    p.image_3,
    p.image_4
  ].filter(Boolean);

  const main = document.getElementById('main-product-img');

  if (!main) return;

  // Load the actual Supabase product image
  if (images.length > 0) {
    main.src = images[0];
    main.alt = p.name || 'Product image';
    main.style.display = 'block';
  }

  const thumbList =
    document.getElementById('thumb-list');

  if (!thumbList) return;

  // Hide thumbnails when there is only one image
  if (images.length <= 1) {
    thumbList.style.display = 'none';
    return;
  }

  thumbList.style.display = '';

  thumbList.innerHTML = images
    .map((src, i) => `
      <div class="thumb-item${i === 0 ? ' active' : ''}">
        <img
          src="${escapeHtml(src)}"
          alt="${escapeHtml(
            p.name || 'Product'
          )} — view ${i + 1}"
          onerror="
            this.parentElement.style.display='none'
          "
        >
      </div>
    `)
    .join('');

  thumbList
    .querySelectorAll('.thumb-item')
    .forEach(t => {

      t.addEventListener('click', () => {

        thumbList
          .querySelectorAll('.thumb-item')
          .forEach(x => {
            x.classList.remove('active');
          });

        t.classList.add('active');

        const thumbImage =
          t.querySelector('img');

        if (thumbImage && thumbImage.src) {
          main.src = thumbImage.src;
          main.style.display = 'block';
        }

      });

    });
}
/* ============================================================
   PRODUCT DETAIL PAGE
   ============================================================ */

async function initProductPage() {
  await loadProducts();

  const id = Number(
    new URLSearchParams(location.search)
      .get('id') ||
    (PRODUCTS[0]?.id ?? 1)
  );

  const p =
    PRODUCTS.find(x => x.id === id) ||
    PRODUCTS[0];

  if (!p) return;

  const set = (s, v) => {
    const e = document.querySelector(s);

    if (e) {
      e.textContent = v;
    }
  };

  set(
    '.product-detail-name',
    p.name
  );

  set(
    '.product-detail-price',
    formatPrice(p.price)
  );

  set(
    '.breadcrumb span:last-child',
    p.name
  );

  document.title =
    `${p.name} — Wood & Grains Furniture`;

  buildGallery(p);

  const descEl =
    document.querySelector(
      '.product-detail-desc'
    );

  if (descEl && p.description) {
    descEl.textContent = p.description;
  }

  const infoWrap =
    document.getElementById(
      'product-extra-info'
    );

  const infoBody =
    document.getElementById(
      'product-extra-info-body'
    );

  if (infoWrap && infoBody) {

    if (
      p.product_info &&
      p.product_info.trim()
    ) {
      infoBody.textContent =
        p.product_info;

      infoWrap.style.display = '';
    } else {
      infoWrap.style.display = 'none';
    }
  }

  const enquireBtn =
    document.getElementById(
      'enquire-btn'
    );

  if (enquireBtn) {
    enquireBtn.addEventListener(
      'click',
      () => enquireProduct(p)
    );
  }

  const rg =
    document.getElementById(
      'related-grid'
    );

  if (rg) {
    rg.innerHTML = PRODUCTS
      .filter(x => x.id !== p.id)
      .slice(0, 4)
      .map(buildProductCard)
      .join('');
  }
}


/* ============================================================
   CUSTOM BUILD
   ============================================================ */

function customBuildWhatsApp() {
  const v = id =>
    document.getElementById(id)?.value.trim() ||
    'Not provided';

  showToast(
    'Redirecting you to our team on WhatsApp to complete your request',
    'redirect'
  );

  openWhatsApp(`
Hello Wood & Grains Furniture, I would like to request a custom furniture build.

CUSTOM BUILD REQUEST
Name: ${v('cf-name')}
Email: ${v('cf-email')}
Phone: ${v('cf-phone')}
Furniture type: ${v('cf-type')}
Budget: ${v('cf-budget')}
Timeline: ${v('cf-timeline')}
Description: ${v('cf-desc')}

Please contact me with the quote and next steps.
`);
}


/* ============================================================
   MOBILE STYLES
   ============================================================ */

function injectMobileStyles() {
  const s = document.createElement('style');

  s.textContent = `
@media(max-width:700px){

  .container{
    padding-left:18px!important;
    padding-right:18px!important;
  }

  .navbar{
    height:64px;
  }

  .navbar .container{
    min-height:64px;
    padding-left:18px!important;
    padding-right:18px!important;
    gap:8px;
  }

  .footer-grid{
    grid-template-columns:1fr!important;
    gap:28px!important;
  }

  .footer-brand{
    max-width:100%;
  }

  .footer-brand .nav-logo{
    font-size:18px;
    line-height:1.2;
    white-space:normal;
  }

  .footer-col{
    border-top:1px solid var(--border-lt);
    padding-top:20px;
  }

  .footer-newsletter{
    border-top:1px solid var(--border-lt);
    padding-top:20px;
  }

  .newsletter-form{
    display:flex!important;
    width:100%;
  }

  .newsletter-form input{
    min-width:0!important;
    flex:1;
  }

  .footer-bottom{
    flex-direction:column!important;
    align-items:flex-start!important;
    gap:14px!important;
    padding-bottom:24px;
  }

  .footer-socials{
    align-self:flex-start;
  }

  .custom-form-section{
    padding:28px 18px!important;
    margin-top:40px!important;
  }

  .form-grid{
    gap:16px!important;
  }

  .product-detail-grid{
    grid-template-columns:1fr!important;
  }

  .related-grid,
  .products-grid{
    grid-template-columns:
      repeat(2,minmax(0,1fr))!important;
    gap:12px!important;
  }

  .product-info{
    padding:10px!important;
  }

  .product-name{
    font-size:13px!important;
  }

  .product-price{
    font-size:13px!important;
  }

  .breadcrumb{
    padding-top:20px!important;
  }

  .section-title{
    line-height:1.12;
  }

  .search-box{
    width:calc(100% - 28px)!important;
  }

  .btn-lg{
    min-height:46px;
  }

  .custom-build-hero{
    grid-template-columns:1fr!important;
  }

  .custom-build-img{
    min-height:260px!important;
  }

  .custom-options-grid{
    grid-template-columns:1fr 1fr!important;
    gap:12px!important;
  }

  .custom-option-card{
    padding:18px 14px!important;
  }

  .custom-option-card h3{
    font-size:14px!important;
  }

  .custom-option-card p{
    font-size:12px!important;
  }
}

@media(max-width:420px){

  .related-grid,
  .products-grid{
    grid-template-columns:
      1fr 1fr!important;
  }

  .custom-options-grid{
    grid-template-columns:1fr!important;
  }
}
`;

  document.head.appendChild(s);
}


/* ============================================================
   FORM HANDLING
   ============================================================ */

document.addEventListener(
  'submit',
  e => {

    if (
      document.body.dataset.page ===
        'custom-build' &&
      e.target.matches('form')
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();

      customBuildWhatsApp();
    }

  },
  true
);


/* ============================================================
   INITIALIZATION
   ============================================================ */

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    injectMobileStyles();

    initNavbar();

    const p =
      document.body.dataset.page;

    if (p === 'shop') {
      initShopPage();
    }

    if (p === 'product') {
      initProductPage();
    }

    if (p === 'home') {

      await loadProducts();

      const g =
        document.getElementById(
          'featured-grid'
        );

      if (g) {
        g.innerHTML =
          PRODUCTS
            .slice(0, 4)
            .map(buildProductCard)
            .join('');
      }
    }
  }
);
