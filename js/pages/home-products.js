(() => {
  'use strict';

  const catalog = Array.isArray(window.products) ? window.products : [];
  const initialQuery = new URLSearchParams(window.location.search).get('search') || '';
  const state = { category: 'All Products', search: initialQuery };
  const grid = document.querySelector('[data-products-grid]');
  const categoryNav = document.querySelector('[data-category-nav]');
  const count = document.querySelector('[data-product-count]');
  const search = document.querySelector('[data-product-search]');
  const clearSearch = document.querySelector('[data-clear-search]');
  const headerSearch = document.querySelector('[data-header-search]');
  const headerClearSearch = document.querySelector('[data-header-search-clear]');
  const notify = (message, type = 'info') => { if (window.showToast) window.showToast(message, type); };

  const categories = () => ['All Products', ...new Set(catalog.map((product) => product.category).filter(Boolean))];
  const matches = (product) => {
    const selectedCategory = state.category === 'All Products' || product.category === state.category;
    const query = state.search.trim().toLowerCase();
    if (!selectedCategory || !query) return selectedCategory;
    return [product.title, product.brand, product.category, product.subcategory, product.description, product.color, ...product.tags].join(' ').toLowerCase().includes(query);
  };

  const renderCategories = () => {
    if (!categoryNav) return;
    categoryNav.replaceChildren();
    categories().forEach((category) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = `category-button${state.category === category ? ' is-active' : ''}`; button.dataset.category = category; button.setAttribute('aria-pressed', String(state.category === category));
      const label = document.createElement('span'); label.textContent = category; const total = document.createElement('small'); total.textContent = category === 'All Products' ? catalog.length : catalog.filter((product) => product.category === category).length; button.append(label, total); categoryNav.appendChild(button);
    });
  };

  const renderProducts = () => {
    if (!grid) return;
    grid.setAttribute('aria-busy', 'true');
    const visibleProducts = catalog.filter(matches); grid.classList.toggle('is-refreshing', true); window.requestAnimationFrame(() => grid.classList.remove('is-refreshing'));
    grid.replaceChildren();
    visibleProducts.forEach((product) => grid.appendChild(window.createProductCard(product)));
    if (count) count.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? 'product' : 'products'}`;
    const empty = document.querySelector('[data-products-empty]'); if (empty) empty.hidden = visibleProducts.length !== 0;
    if (clearSearch) clearSearch.hidden = state.search.length === 0;
    grid.setAttribute('aria-busy', 'false');
  };

  const showLoadingSkeletons = () => { if (!grid) return; grid.replaceChildren(); for (let index = 0; index < 8; index += 1) { const card = document.createElement('article'); card.className = 'product-card skeleton-card'; card.setAttribute('aria-hidden', 'true'); card.innerHTML = '<div class="skeleton-block skeleton-visual"></div><div class="skeleton-content"><span class="skeleton-block skeleton-line short"></span><span class="skeleton-block skeleton-line"></span><span class="skeleton-block skeleton-line medium"></span><span class="skeleton-block skeleton-line price"></span></div>'; grid.appendChild(card); } };

  const rerender = () => { renderCategories(); renderProducts(); };
  const requireUser = () => {
    if (window.shoppingStorage?.getCurrentUserEmail()) return true;
    notify('Please log in or create an account to save shopping items.');
    return false;
  };

  categoryNav?.addEventListener('click', (event) => { const button = event.target.closest('[data-category]'); if (!button) return; state.category = button.dataset.category; rerender(); });
  const syncSearchInputs = (value) => { if (search) search.value = value; if (headerSearch) headerSearch.value = value; if (clearSearch) clearSearch.hidden = value.length === 0; if (headerClearSearch) headerClearSearch.hidden = value.length === 0; };
  search?.addEventListener('input', () => { state.search = search.value; syncSearchInputs(state.search); renderProducts(); });
  headerSearch?.addEventListener('input', () => { state.search = headerSearch.value; syncSearchInputs(state.search); renderProducts(); });
  clearSearch?.addEventListener('click', () => { state.search = ''; syncSearchInputs(''); renderProducts(); search?.focus(); });
  headerClearSearch?.addEventListener('click', () => { state.search = ''; syncSearchInputs(''); renderProducts(); headerSearch?.focus(); });
  grid?.addEventListener('click', (event) => {
    const favoriteButton = event.target.closest('[data-favorite-id]');
    const cartButton = event.target.closest('[data-cart-id]');
    if (favoriteButton) {
      event.preventDefault(); event.stopPropagation(); if (!requireUser()) return;
      const result = window.shoppingStorage.toggleFavorite(Number(favoriteButton.dataset.favoriteId));
      if (result.ok) { favoriteButton.classList.toggle('is-favorite', result.isFavorite); favoriteButton.setAttribute('aria-pressed', String(result.isFavorite)); favoriteButton.setAttribute('aria-label', result.isFavorite ? 'Remove from wishlist' : 'Add to wishlist'); notify(result.isFavorite ? 'Added to your wishlist.' : 'Removed from your wishlist.', 'success'); }
    }
    if (cartButton) {
      event.preventDefault(); event.stopPropagation(); if (!requireUser()) return;
      const result = window.shoppingStorage.addToCart(Number(cartButton.dataset.cartId));
      if (result.ok) notify(`${result.product.title} added to your cart.`, 'success'); else if (result.reason === 'stock-limit') notify('You have reached the available stock for this product.', 'warning'); else if (result.reason === 'out-of-stock') notify('This product is currently out of stock.', 'warning');
    }
  });
  window.addEventListener('luxora:cart-updated', () => { if (window.refreshHeaderCounters) window.refreshHeaderCounters(); });
  window.addEventListener('luxora:favorites-updated', () => { if (window.refreshHeaderCounters) window.refreshHeaderCounters(); });
  showLoadingSkeletons();
  syncSearchInputs(state.search);
  window.requestAnimationFrame(rerender);
})();
