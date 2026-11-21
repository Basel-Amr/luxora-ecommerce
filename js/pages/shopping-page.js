(() => {
  'use strict';

  const content = document.querySelector('[data-shopping-content]');
  const requestedTab = new URLSearchParams(window.location.search).get('tab');
  const state = { tab: requestedTab === 'wishlist' ? 'wishlist' : 'cart' };

  const money = (product, value) => new Intl.NumberFormat('en-EG', {
    style: 'currency', currency: product.currency || 'EGP', maximumFractionDigits: 0,
  }).format(value);

  const notify = (message, type = 'info') => { if (window.showToast) window.showToast(message, type); };

  const button = (label, className, attributes = {}) => {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = className;
    element.textContent = label;
    Object.entries(attributes).forEach(([key, value]) => { element.dataset[key] = value; });
    return element;
  };

  const createIcon = (path, wheels = false) => { const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path'); shape.setAttribute('d', path); svg.appendChild(shape); if (wheels) [10, 18].forEach((cx) => { const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); circle.setAttribute('cx', cx); circle.setAttribute('cy', '20'); circle.setAttribute('r', '1'); svg.appendChild(circle); }); return svg; };
  const emptyState = (title, message, href = 'index.html#products', label = 'Continue Shopping', iconType = 'cart') => {
    const wrapper = document.createElement('div'); wrapper.className = 'shopping-empty';
    const visual = document.createElement('span'); visual.className = 'shopping-empty-icon'; visual.setAttribute('aria-hidden', 'true'); visual.appendChild(iconType === 'heart' ? createIcon('M20.8 8.9c0 5.3-8.8 10.1-8.8 10.1S3.2 14.2 3.2 8.9A4.4 4.4 0 0 1 11 6.1a4.4 4.4 0 0 1 9.8 2.8Z') : createIcon('M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6', true));
    const heading = document.createElement('h2'); heading.textContent = title;
    const text = document.createElement('p'); text.textContent = message;
    const link = document.createElement('a'); link.href = href; link.textContent = label;
    wrapper.append(visual, heading, text, link); return wrapper;
  };

  const renderAuthRequired = () => content.replaceChildren(emptyState('Sign in to view your shopping', 'Your private cart and wishlist will appear here after you sign in.', 'login.html', 'Sign in'));
  const userRequired = () => {
    if (window.shoppingStorage?.getCurrentUserEmail()) return true;
    renderAuthRequired(); return false;
  };

  const updateTabs = () => {
    const cartCount = window.shoppingStorage?.getCartCount() || 0;
    const favoriteCount = window.shoppingStorage?.getFavoritesCount() || 0;
    document.querySelector('[data-cart-tab-count]').textContent = cartCount;
    document.querySelector('[data-wishlist-tab-count]').textContent = favoriteCount;
  };

  const setActiveTab = (tabName) => {
    state.tab = tabName === 'wishlist' ? 'wishlist' : 'cart';
    document.querySelectorAll('[data-shopping-tab]').forEach((tab) => {
      const active = tab.dataset.shoppingTab === state.tab;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
  };

  const appendPriceDetails = (container, product) => {
    const price = document.createElement('strong'); price.textContent = money(product, product.price); container.appendChild(price);
    if (product.oldPrice) {
      const oldPrice = document.createElement('del'); oldPrice.textContent = money(product, product.oldPrice);
      const discount = document.createElement('span'); discount.className = 'discount-label'; discount.textContent = `${window.getDiscountPercentage(product)}% off`;
      container.append(oldPrice, discount);
    }
  };

  const createCartItem = (product, entry) => {
    const row = document.createElement('article'); row.className = 'shopping-item'; row.dataset.productId = product.id;
    const image = document.createElement('img'); image.className = 'shopping-item-image'; image.src = product.imageUrl; image.alt = product.imageAlt; image.addEventListener('error', () => { image.hidden = true; }, { once: true });
    const details = document.createElement('div'); details.className = 'shopping-item-details';
    const category = document.createElement('p'); category.className = 'product-category'; category.textContent = product.subcategory;
    const title = document.createElement('h2'); title.textContent = product.title;
    const meta = document.createElement('p'); meta.className = 'shopping-meta'; meta.textContent = `${product.brand} · SKU ${product.sku} · ${product.color}`;
    const description = document.createElement('p'); description.className = 'shopping-description'; description.textContent = product.description;
    details.append(category, title, meta, description);
    const controls = document.createElement('div'); controls.className = 'shopping-item-controls';
    const quantity = document.createElement('div'); quantity.className = 'quantity-control'; quantity.append(button('−', 'quantity-button', { quantityAction: 'decrease' }), Object.assign(document.createElement('span'), { className: 'quantity-value', textContent: entry.quantity }), button('+', 'quantity-button', { quantityAction: 'increase' }));
    const stock = document.createElement('span'); stock.className = `item-stock${product.stock < 10 ? ' low-stock' : ''}`; stock.textContent = `${product.stock} available`;
    const price = document.createElement('div'); price.className = 'item-price'; const unit = document.createElement('span'); unit.textContent = `${money(product, product.price)} each`; const subtotal = document.createElement('strong'); subtotal.textContent = money(product, product.price * entry.quantity); price.append(unit); if (product.oldPrice) { const oldPrice = document.createElement('del'); oldPrice.textContent = money(product, product.oldPrice); const discount = document.createElement('small'); discount.className = 'discount-label'; discount.textContent = `${window.getDiscountPercentage(product)}% off`; price.append(oldPrice, discount); } price.append(subtotal); controls.append(quantity, stock, price);
    const actions = document.createElement('div'); actions.className = 'shopping-item-actions'; actions.append(button('Move to wishlist', 'text-action', { itemAction: 'wishlist' }), button('Remove', 'text-action danger', { itemAction: 'remove' }));
    row.append(image, details, controls, actions); return row;
  };

  const renderCart = () => {
    if (!userRequired()) return;
    const valid = window.shoppingStorage.getUserCart().map((entry) => ({ entry, product: window.getProductById(entry.productId) })).filter(({ product }) => product);
    if (!valid.length) { content.replaceChildren(emptyState('Your cart is empty', 'Discover something beautiful and make it yours.')); return; }
    const layout = document.createElement('div'); layout.className = 'shopping-layout'; const list = document.createElement('div'); list.className = 'shopping-list';
    const heading = document.createElement('div'); heading.className = 'shopping-list-heading'; const headingTitle = document.createElement('h2'); headingTitle.textContent = 'Shopping Cart'; const headingCount = document.createElement('p'); headingCount.textContent = `${valid.length} unique ${valid.length === 1 ? 'product' : 'products'}`; heading.append(headingTitle, headingCount); list.appendChild(heading);
    valid.forEach(({ entry, product }) => list.appendChild(createCartItem(product, entry)));
    const subtotal = valid.reduce((sum, { entry, product }) => sum + product.price * entry.quantity, 0); const savings = valid.reduce((sum, { entry, product }) => sum + (product.oldPrice > product.price ? (product.oldPrice - product.price) * entry.quantity : 0), 0); const quantity = valid.reduce((sum, { entry }) => sum + entry.quantity, 0);
    const summary = document.createElement('aside'); summary.className = 'order-summary'; const summaryTitle = document.createElement('h2'); summaryTitle.textContent = 'Order Summary'; const unique = document.createElement('p'); unique.append('Unique products', Object.assign(document.createElement('strong'), { textContent: valid.length })); const totalItems = document.createElement('p'); totalItems.append('Total quantity', Object.assign(document.createElement('strong'), { textContent: quantity })); const subtotalRow = document.createElement('p'); subtotalRow.append('Subtotal', Object.assign(document.createElement('strong'), { textContent: money(valid[0].product, subtotal) })); const savingRow = document.createElement('p'); savingRow.className = 'summary-saving'; savingRow.append('Discount savings', Object.assign(document.createElement('strong'), { textContent: `−${money(valid[0].product, savings)}` })); const shipping = document.createElement('p'); shipping.append('Shipping', Object.assign(document.createElement('strong'), { textContent: 'Calculated at checkout' })); const total = document.createElement('p'); total.className = 'summary-total'; total.append('Total today', Object.assign(document.createElement('strong'), { textContent: money(valid[0].product, subtotal) })); const checkout = button('Checkout — coming soon', 'checkout-button'); checkout.disabled = true; summary.append(summaryTitle, unique, totalItems, subtotalRow, savingRow, shipping, total, checkout); layout.append(list, summary); content.replaceChildren(layout);
  };

  const createWishlistItem = (product) => {
    const card = document.createElement('article'); card.className = 'wishlist-item'; const image = document.createElement('img'); image.src = product.imageUrl; image.alt = product.imageAlt; image.addEventListener('error', () => { image.hidden = true; }, { once: true }); const details = document.createElement('div');
    const category = document.createElement('p'); category.className = 'product-category'; category.textContent = product.subcategory; const title = document.createElement('h2'); title.textContent = product.title; const meta = document.createElement('p'); meta.className = 'wishlist-meta'; meta.textContent = `${product.brand} · SKU ${product.sku} · ${product.category}`; const description = document.createElement('p'); description.textContent = product.description; const rating = document.createElement('p'); rating.className = 'wishlist-rating'; rating.textContent = `\u2605 ${product.rating.toFixed(1)} · ${product.reviewsCount} reviews`; const pricing = document.createElement('div'); pricing.className = 'wishlist-pricing'; appendPriceDetails(pricing, product); const stock = document.createElement('span'); stock.className = product.stock > 0 ? 'item-stock' : 'item-stock low-stock'; stock.textContent = product.stock > 0 ? `${product.stock} available` : 'Out of stock'; const actions = document.createElement('div'); actions.className = 'wishlist-actions'; const add = button('Add to cart', 'small-action', { wishlistCart: product.id }); add.disabled = product.stock < 1; actions.append(add, button('Remove', 'text-action danger', { wishlistRemove: product.id })); details.append(category, title, meta, description, rating, pricing, stock, actions); card.append(image, details); return card;
  };

  const renderWishlist = () => { if (!userRequired()) return; const products = window.shoppingStorage.getUserFavorites().map((id) => window.getProductById(id)).filter(Boolean); if (!products.length) { content.replaceChildren(emptyState('Your Wishlist is Empty', 'Save products you love and return to them whenever you are ready.', 'index.html#products', 'Continue Shopping', 'heart')); return; } const list = document.createElement('div'); list.className = 'wishlist-list'; products.forEach((product) => list.appendChild(createWishlistItem(product))); content.replaceChildren(list); };
  const render = () => { content?.setAttribute('aria-busy', 'true'); updateTabs(); if (state.tab === 'wishlist') renderWishlist(); else renderCart(); content?.setAttribute('aria-busy', 'false'); };
  const showLoading = () => { if (!content) return; const loading = document.createElement('div'); loading.className = state.tab === 'wishlist' ? 'wishlist-list shopping-loading' : 'shopping-loading'; for (let index = 0; index < 2; index += 1) { const item = document.createElement('div'); item.className = state.tab === 'wishlist' ? 'shopping-loading-card' : 'shopping-loading-row'; item.setAttribute('aria-hidden', 'true'); loading.appendChild(item); } content.replaceChildren(loading); };

  document.querySelector('[data-shopping-tabs]')?.addEventListener('click', (event) => { const tab = event.target.closest('[data-shopping-tab]'); if (!tab) return; setActiveTab(tab.dataset.shoppingTab); render(); });
  content?.addEventListener('click', (event) => { const item = event.target.closest('[data-product-id]'); if (item) { const id = Number(item.dataset.productId); const action = event.target.closest('[data-item-action]')?.dataset.itemAction; const quantityAction = event.target.closest('[data-quantity-action]')?.dataset.quantityAction; const entry = window.shoppingStorage.getUserCart().find((cartItem) => cartItem.productId === id); const product = window.getProductById(id); if (quantityAction && entry && product) { const next = quantityAction === 'increase' ? entry.quantity + 1 : entry.quantity - 1; if (next > product.stock) notify('You have reached the available stock.'); else window.shoppingStorage.updateCartQuantity(id, next); render(); } if (action === 'remove') { window.shoppingStorage.removeFromCart(id); notify('Item removed from your cart.'); render(); } if (action === 'wishlist') { window.shoppingStorage.toggleFavorite(id); window.shoppingStorage.removeFromCart(id); notify('Moved to your wishlist.'); render(); } } const wishlistCart = event.target.closest('[data-wishlist-cart]'); if (wishlistCart) { const result = window.shoppingStorage.addToCart(Number(wishlistCart.dataset.wishlistCart)); if (result.ok) notify('Added to your cart.'); else if (result.reason === 'stock-limit') notify('You have reached the available stock.'); render(); } const wishlistRemove = event.target.closest('[data-wishlist-remove]'); if (wishlistRemove) { const result = window.shoppingStorage.toggleFavorite(Number(wishlistRemove.dataset.wishlistRemove)); if (result.ok) notify('Removed from your wishlist.'); render(); } });
  window.addEventListener('luxora:open-wishlist', () => { setActiveTab('wishlist'); render(); }); window.addEventListener('luxora:cart-updated', render); window.addEventListener('luxora:favorites-updated', render); setActiveTab(state.tab); showLoading(); window.requestAnimationFrame(render);
})();
