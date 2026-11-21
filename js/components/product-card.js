(() => {
  'use strict';

  const paths = {
    heart: 'M20.8 8.9c0 5.3-8.8 10.1-8.8 10.1S3.2 14.2 3.2 8.9A4.4 4.4 0 0 1 11 6.1a4.4 4.4 0 0 1 9.8 2.8Z',
    cart: 'M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6',
  };
  const svg = (name) => { const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true'); const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', paths[name]); icon.appendChild(path); if (name === 'cart') [10, 18].forEach((cx) => { const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); circle.setAttribute('cx', cx); circle.setAttribute('cy', '20'); circle.setAttribute('r', '1'); icon.appendChild(circle); }); return icon; };
  const price = (product, value) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: product.currency || 'EGP', maximumFractionDigits: 0 }).format(value);
  const stars = (rating) => { const filled = String.fromCodePoint(0x2605); const empty = String.fromCodePoint(0x2606); return Array.from({ length: 5 }, (_, index) => index < Math.round(rating) ? filled : empty).join(''); };

  const createProductCard = (product) => {
    const card = document.createElement('article'); card.className = 'product-card'; card.dataset.productId = product.id;
    const visual = document.createElement('div'); visual.className = 'product-visual';
    if (product.badge) { const badge = document.createElement('span'); badge.className = 'product-badge'; badge.textContent = product.badge; visual.appendChild(badge); }
    const image = document.createElement('img'); image.className = 'product-image'; image.src = product.imageUrl; image.alt = product.imageAlt; image.loading = 'lazy';
    const fallback = document.createElement('span'); fallback.className = 'product-image-fallback'; fallback.textContent = 'Image unavailable'; fallback.hidden = true; image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; }, { once: true }); visual.append(image, fallback);
    const actions = document.createElement('div'); actions.className = 'product-actions';
    const favorite = document.createElement('button'); favorite.className = 'card-action wishlist-action'; favorite.type = 'button'; favorite.dataset.favoriteId = product.id; favorite.appendChild(svg('heart'));
    const inFavorites = window.shoppingStorage?.isProductFavorite(product.id) || false; favorite.classList.toggle('is-favorite', inFavorites); favorite.setAttribute('aria-pressed', String(inFavorites)); favorite.setAttribute('aria-label', inFavorites ? 'Remove from wishlist' : 'Add to wishlist');
    const add = document.createElement('button'); add.className = 'card-action add-cart-action'; add.type = 'button'; add.dataset.cartId = product.id; add.appendChild(svg('cart')); const addText = document.createElement('span'); addText.textContent = product.stock > 0 ? 'Add to cart' : 'Out of stock'; add.appendChild(addText); add.disabled = product.stock < 1; actions.append(favorite, add); visual.appendChild(actions); card.appendChild(visual);
    const content = document.createElement('div'); content.className = 'product-content'; const category = document.createElement('p'); category.className = 'product-category'; category.textContent = product.subcategory; const title = document.createElement('h3'); title.className = 'product-title'; title.textContent = product.title; const rating = document.createElement('div'); rating.className = 'product-rating'; const starsText = document.createElement('span'); starsText.className = 'rating-stars'; starsText.textContent = stars(product.rating); const ratingText = document.createElement('span'); ratingText.textContent = `${product.rating.toFixed(1)} ${String.fromCharCode(0xB7)} ${product.reviewsCount} reviews`; rating.append(starsText, ratingText);
    const prices = document.createElement('div'); prices.className = 'product-pricing'; const current = document.createElement('strong'); current.textContent = price(product, product.price); prices.appendChild(current); if (product.oldPrice) { const old = document.createElement('del'); old.textContent = price(product, product.oldPrice); prices.appendChild(old); const discount = document.createElement('span'); discount.className = 'discount-label'; discount.textContent = `-${window.getDiscountPercentage(product)}%`; prices.appendChild(discount); }
    const stock = document.createElement('p'); stock.className = `stock-status${product.stock < 10 ? ' low-stock' : ''}`; stock.textContent = product.stock > 0 ? `${product.stock} available` : 'Currently unavailable'; content.append(category, title, rating, prices, stock); card.appendChild(content); return card;
  };
  window.createProductCard = createProductCard;
})();
