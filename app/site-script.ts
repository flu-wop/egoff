// Auto-extracted verbatim from legacy index.html <script> (cart/checkout/newsletter logic)
export const siteScript = `
// ── CART ──────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('egoff-cart') || '[]');
function saveCart() { localStorage.setItem('egoff-cart', JSON.stringify(cart)); }

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) { existing.qty++; } else { cart.push({ name, price, qty: 1 }); }
  saveCart(); renderCart(); showToast('🌿 ' + name + ' added to cart');
}

function removeItem(name) { cart = cart.filter(i => i.name !== name); saveCart(); renderCart(); }

function changeQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.name !== name);
  saveCart(); renderCart();
}

function clearCartConfirm() {
  if (confirm('Remove all items from your cart?')) { cart = []; saveCart(); renderCart(); }
}

function renderCart() {
  const el = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const countEl = document.getElementById('cart-count');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  countEl.textContent = count;
  subtotalEl.textContent = '$' + total.toFixed(2);
  if (cart.length === 0) {
    el.innerHTML = '<p class="font-cormorant italic text-emerald-400 text-center py-10">Your cart is empty.<br/>Add something beautiful.</p>';
    return;
  }
  el.innerHTML = cart.map(item => \`
    <div class="flex items-center gap-3 bg-amber-50 rounded-xl px-3 py-3">
      <div class="flex-1 min-w-0">
        <p class="font-cinzel text-emerald-900 text-xs tracking-wide truncate">\${item.name}</p>
        <p class="font-lato text-emerald-600 text-xs mt-0.5">$\${item.price.toFixed(2)} each</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button onclick="changeQty('\${item.name}',-1)" class="w-6 h-6 rounded-full border border-emerald-300 text-emerald-700 text-sm hover:bg-emerald-100 flex items-center justify-center">−</button>
        <span class="font-cinzel text-emerald-900 text-sm w-4 text-center">\${item.qty}</span>
        <button onclick="changeQty('\${item.name}',1)" class="w-6 h-6 rounded-full border border-emerald-300 text-emerald-700 text-sm hover:bg-emerald-100 flex items-center justify-center">+</button>
      </div>
      <span class="font-cinzel text-emerald-900 text-xs flex-shrink-0">$\${(item.price * item.qty).toFixed(2)}</span>
      <button onclick="removeItem('\${item.name}')" class="text-red-300 hover:text-red-500 text-lg leading-none flex-shrink-0">&times;</button>
    </div>
  \`).join('');
}

// ── CART OPEN/CLOSE ──────────────────────────────────
function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── CHECKOUT ─────────────────────────────────────────

// ── NEWSLETTER ────────────────────────────────────────────
function submitNewsletter(e) {
  e.preventDefault();
  const name  = document.getElementById('nl-name').value.trim();
  const email = document.getElementById('nl-email').value.trim();
  fetch('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  }).then(async (res) => {
    if (!res.ok) throw new Error('failed');
    document.getElementById('nl-success').style.display = 'block';
    document.getElementById('nl-error').style.display = 'none';
    document.getElementById('newsletter-form').reset();
  }).catch(() => {
    document.getElementById('nl-error').style.display = 'block';
  });
}


function sendOrder() {
  if (cart.length === 0) { showToast('Your cart is empty'); return; }
  closeCart();
  const lines = cart.map(i => \`<div class="checkout-order-line"><span>\${i.qty}× \${i.name}</span><span>$\${(i.price*i.qty).toFixed(2)}</span></div>\`).join('');
  const total = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const freeShip = false;
  document.getElementById('checkout-summary-lines').innerHTML =
    lines +
    \`<div class="checkout-order-line" style="margin-top:4px;"><span>Shipping</span><span>Calculated at confirmation</span></div>\` +
    \`<div class="checkout-order-line"><span>Order Total</span><span>$\${total.toFixed(2)}</span></div>\`;
  document.getElementById('checkout-form-body').style.display = 'block';
  document.getElementById('checkout-success').style.display = 'none';
  document.getElementById('checkout-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCheckout() {
  document.getElementById('checkout-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function submitCheckout() {
  const name   = document.getElementById('co-name').value.trim();
  const email  = document.getElementById('co-email').value.trim();
  const street = document.getElementById('co-street').value.trim();
  const city   = document.getElementById('co-city').value.trim();
  const state  = document.getElementById('co-state').value.trim();
  const zip    = document.getElementById('co-zip').value.trim();
  const phone  = document.getElementById('co-phone').value.trim();
  const notes  = document.getElementById('co-notes').value.trim();
  const errEl  = document.getElementById('checkout-error');
  const btn    = document.querySelector('.checkout-submit-btn');
  if (!name || !email || !street || !city || !state || !zip) {
    errEl.textContent = 'Please fill in all required fields.'; errEl.style.display = 'block'; return;
  }
  if (!email.includes('@')) {
    errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = 'block'; return;
  }
  errEl.style.display = 'none';
  const originalBtnText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }

  fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart: cart.map(i => ({ name: i.name, qty: i.qty })),
      name, email, phone, street, city, state, zip, notes
    })
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    if (data.url) {
      window.location.href = data.url; // hand off to Stripe Checkout
    } else {
      throw new Error('No checkout URL returned');
    }
  }).catch((err) => {
    errEl.textContent = err.message || 'Something went wrong. Please try again or call (504) 957-0324.';
    errEl.style.display = 'block';
    if (btn) { btn.disabled = false; btn.textContent = originalBtnText; }
  });
}

// ── LEGAL MODAL ──────────────────────────────────────
const legalContent = {
  terms: {
    title: 'Terms of Service',
    html: \`<p><strong>Last updated: 2026</strong></p>
      <p>Welcome to EGOFF Essentials. By purchasing from or using our website, you agree to these terms.</p>
      <p><strong>Products &amp; Use</strong><br/>All EGOFF Essentials products are handcrafted natural soaps and body care items intended for external use only. They are not intended to diagnose, treat, cure, or prevent any disease.</p>
      <p><strong>Orders &amp; Payment</strong><br/>Orders are submitted directly to Ericka Goff and confirmed personally. Payment arrangements will be communicated after order receipt. We reserve the right to cancel or modify orders at our discretion.</p>
      <p><strong>Shipping</strong><br/>We ship within the United States. Estimated delivery is 5–7 business days after confirmation.</p>
      <p><strong>Returns &amp; Refunds</strong><br/>Due to the handcrafted nature of our products, all sales are generally final. If you received a damaged or incorrect item, please contact us within 7 days of delivery.</p>
      <p><strong>Intellectual Property</strong><br/>All content, branding, and imagery on this site are the property of EGOFF Essentials / Egoff Enterprise LLC. Unauthorized use is prohibited.</p>
      <p><strong>Contact</strong><br/>Questions? Email egoffessentials@gmail.com.</p>\`
  },
  privacy: {
    title: 'Privacy Policy',
    html: \`<p><strong>Last updated: 2026</strong></p>
      <p>EGOFF Essentials values your privacy. This policy explains how we collect and use your information.</p>
      <p><strong>Information We Collect</strong><br/>We collect your name, email, phone, and shipping address when you place an order. We do not store payment information.</p>
      <p><strong>How We Use Your Information</strong><br/>Your information is used solely to fulfill your order and communicate with you about it. We do not sell or share your personal data with third parties.</p>
      <p><strong>Cookies &amp; Analytics</strong><br/>This site uses browser localStorage to maintain your shopping cart. We use Google Analytics to understand how visitors use the site (pages visited, traffic sources). No personal information is shared with Google Analytics.</p>
      <p><strong>Contact</strong><br/>Questions about your data? Email egoffessentials@gmail.com.</p>\`
  }
};
function openLegal(type) {
  const c = legalContent[type];
  document.getElementById('legal-title').textContent = c.title;
  document.getElementById('legal-body').innerHTML = c.html;
  document.getElementById('legal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLegal() {
  document.getElementById('legal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── TOAST ─────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translateY(0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-10px)'; }, 2800);
}

// ── MOBILE MENU ───────────────────────────────────────
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }
function closeMobileMenu() { document.getElementById('mobile-menu').classList.remove('open'); }

// ── FAQ ───────────────────────────────────────────────
function toggleFaq(btn) {
  const body = btn.nextElementSibling;
  const arrow = btn.querySelector('.faq-arrow');
  const isOpen = body.classList.contains('open');
  document.querySelectorAll('.faq-body.open').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.faq-arrow.open').forEach(a => a.classList.remove('open'));
  if (!isOpen) { body.classList.add('open'); arrow.classList.add('open'); }
}

// ── FADE-UP ON SCROLL ────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 70);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// ── INIT ──────────────────────────────────────────────
renderCart();
if (new URLSearchParams(window.location.search).get('canceled') === '1') {
  showToast('Checkout canceled — your cart is still here');
  const url = new URL(window.location.href);
  url.searchParams.delete('canceled');
  window.history.replaceState({}, '', url.toString());
}
`;
