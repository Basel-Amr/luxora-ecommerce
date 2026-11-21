(() => {
  'use strict';

  const CART_PREFIX = 'luxora_cart_';
  const FAVORITES_PREFIX = 'luxora_favorites_';
  const LEGACY_OWNER_KEY = 'luxora_legacy_owner_email';

  const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
  const parseArray = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) { return []; }
  };
  const productById = (productId) => window.getProductById?.(productId) || window.products?.find((product) => product.id === Number(productId));
  const validProductId = (productId) => {
    const product = productById(productId);
    return product ? Number(product.id) : null;
  };
  const userKey = (prefix) => {
    const email = getCurrentUserEmail();
    return email ? `${prefix}${encodeURIComponent(email)}` : null;
  };

  const getCurrentUserEmail = () => {
    if (localStorage.getItem('loggedIn') !== 'true') return null;
    try {
      const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
      const email = normalizeEmail(user?.email);
      return email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
    } catch (error) { return null; }
  };

  const getUserCart = () => {
    const key = userKey(CART_PREFIX);
    if (!key) return [];
    return parseArray(key).filter((entry) => {
      const product = productById(entry?.productId);
      return product && product.stock > 0 && Number.isInteger(entry.quantity) && entry.quantity >= 1;
    }).map((entry) => {
      const product = productById(entry.productId);
      return { productId: Number(entry.productId), quantity: Math.min(entry.quantity, product.stock), addedAt: entry.addedAt || new Date().toISOString() };
    });
  };

  const saveUserCart = (cart) => {
    const key = userKey(CART_PREFIX);
    if (!key || !Array.isArray(cart)) return false;
    localStorage.setItem(key, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('luxora:cart-updated', { detail: { cart } }));
    return true;
  };

  const getUserFavorites = () => {
    const key = userKey(FAVORITES_PREFIX);
    if (!key) return [];
    return [...new Set(parseArray(key).map(validProductId).filter(Boolean))];
  };

  const saveUserFavorites = (favorites) => {
    const key = userKey(FAVORITES_PREFIX);
    if (!key || !Array.isArray(favorites)) return false;
    const validFavorites = [...new Set(favorites.map(validProductId).filter(Boolean))];
    localStorage.setItem(key, JSON.stringify(validFavorites));
    window.dispatchEvent(new CustomEvent('luxora:favorites-updated', { detail: { favorites: validFavorites } }));
    return true;
  };

  const addToCart = (productId) => {
    const email = getCurrentUserEmail();
    if (!email) return { ok: false, reason: 'authentication-required' };
    const product = productById(productId);
    if (!product) return { ok: false, reason: 'invalid-product' };
    if (!Number.isInteger(product.stock) || product.stock < 1) return { ok: false, reason: 'out-of-stock', product };
    const cart = getUserCart();
    const existing = cart.find((entry) => entry.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return { ok: false, reason: 'stock-limit', product, cart };
      existing.quantity += 1;
    } else cart.push({ productId: product.id, quantity: 1, addedAt: new Date().toISOString() });
    saveUserCart(cart);
    return { ok: true, product, cart };
  };

  const removeFromCart = (productId) => {
    const id = validProductId(productId);
    if (!id || !getCurrentUserEmail()) return false;
    return saveUserCart(getUserCart().filter((entry) => entry.productId !== id));
  };

  const updateCartQuantity = (productId, quantity) => {
    const id = validProductId(productId);
    const product = productById(id);
    const nextQuantity = Number(quantity);
    if (!id || !product || product.stock < 1 || !getCurrentUserEmail() || !Number.isFinite(nextQuantity)) return false;
    const cart = getUserCart();
    const entry = cart.find((item) => item.productId === id);
    if (!entry) return false;
    entry.quantity = Math.min(product.stock, Math.max(1, Math.floor(nextQuantity)));
    return saveUserCart(cart);
  };

  const toggleFavorite = (productId) => {
    const id = validProductId(productId);
    if (!id || !getCurrentUserEmail()) return { ok: false, reason: 'authentication-required' };
    const favorites = getUserFavorites();
    const index = favorites.indexOf(id);
    if (index >= 0) favorites.splice(index, 1);
    else favorites.push(id);
    saveUserFavorites(favorites);
    return { ok: true, isFavorite: index < 0, favorites };
  };

  const getCartCount = () => getUserCart().reduce((total, entry) => total + entry.quantity, 0);
  const getFavoritesCount = () => getUserFavorites().length;
  const isProductInCart = (productId) => getUserCart().some((entry) => entry.productId === Number(productId));
  const isProductFavorite = (productId) => getUserFavorites().includes(Number(productId));

  // Legacy data has no trustworthy owner marker in this project. Leave it untouched.
  const migrateLegacyShoppingData = () => {
    const owner = normalizeEmail(localStorage.getItem(LEGACY_OWNER_KEY));
    return owner && owner === getCurrentUserEmail() ? false : false;
  };

  window.shoppingStorage = { getCurrentUserEmail, getUserCart, saveUserCart, getUserFavorites, saveUserFavorites, addToCart, removeFromCart, updateCartQuantity, toggleFavorite, getCartCount, getFavoritesCount, isProductInCart, isProductFavorite, migrateLegacyShoppingData };
  Object.assign(window, { getCurrentUserEmail, getUserCart, saveUserCart, getUserFavorites, saveUserFavorites, addToCart, removeFromCart, updateCartQuantity, toggleFavorite, getCartCount, getFavoritesCount, isProductInCart, isProductFavorite });
})();
