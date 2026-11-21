(() => {
  'use strict';


  const parseUser = () => {
    if (localStorage.getItem('loggedIn') !== 'true') return null;
    try {
      const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
      if (!user || typeof user !== 'object' || Array.isArray(user)) return null;
      const firstName = typeof user.firstName === 'string' ? user.firstName.trim() : '';
      const lastName = typeof user.lastName === 'string' ? user.lastName.trim() : '';
      if (!firstName && !lastName) return null;
      return { firstName, lastName, email: user.email || '' };
    } catch (error) { return null; }
  };

  const showToast = (message) => {
    if (window.showToast) window.showToast(message, 'success');
  };

  const updateCountBadge = (selector, value) => {
    const badge = document.querySelector(selector);
    if (!badge) return;
    const previous = badge.textContent; badge.textContent = String(value); badge.hidden = value === 0;
    if (previous !== String(value)) { badge.classList.remove('is-pulsing'); window.requestAnimationFrame(() => badge.classList.add('is-pulsing')); }
  };

  const refreshHeaderCounters = () => {
    if (!window.shoppingStorage || !parseUser()) return;
    updateCountBadge('[data-cart-count]', window.shoppingStorage.getCartCount());
    updateCountBadge('[data-favorites-count]', window.shoppingStorage.getFavoritesCount());
  };

  const getInitials = (user) => {
    const first = user.firstName.trim();
    const last = user.lastName.trim();
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    return (first || last).slice(0, 2).toUpperCase();
  };

  const renderAuthenticatedActions = (user) => {
    const actions = document.querySelector('[data-auth-actions]');
    if (!actions) return;
    actions.replaceChildren();
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'LUXORA customer';
    const profileGroup = document.createElement('div'); profileGroup.className = 'profile-group';
    const profile = document.createElement('div'); profile.className = 'profile-summary'; profile.title = fullName; profile.setAttribute('aria-label', `Account for ${fullName}`);
    const avatar = document.createElement('span'); avatar.className = 'profile-avatar'; avatar.textContent = getInitials(user); avatar.setAttribute('aria-hidden', 'true');
    const profileCopy = document.createElement('span'); profileCopy.className = 'profile-copy';
    const name = document.createElement('strong'); name.className = 'profile-name'; name.textContent = fullName;
    const accountLabel = document.createElement('small'); accountLabel.className = 'profile-label'; accountLabel.textContent = 'MY ACCOUNT';
    profileCopy.append(name, accountLabel); profile.append(avatar, profileCopy); profileGroup.appendChild(profile);
    const wishlist = document.createElement('button'); wishlist.className = 'action-button icon-button'; wishlist.type = 'button'; wishlist.dataset.wishlist = 'true'; wishlist.setAttribute('aria-label', 'Open wishlist'); wishlist.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.9c0 5.3-8.8 10.1-8.8 10.1S3.2 14.2 3.2 8.9A4.4 4.4 0 0 1 11 6.1a4.4 4.4 0 0 1 9.8 2.8Z"/></svg><span class="count-badge" data-favorites-count hidden>0</span>';
    const shoppingActions = document.createElement('div'); shoppingActions.className = 'shopping-actions';
    const cartControl = document.createElement('span'); cartControl.className = 'cart-control';
    const cart = document.createElement('button'); cart.className = 'action-button icon-button'; cart.type = 'button'; cart.dataset.cartTrigger = 'true'; cart.setAttribute('aria-label', 'Open shopping cart'); cart.setAttribute('aria-expanded', 'false'); cart.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span class="count-badge" data-cart-count hidden>0</span>';
    shoppingActions.append(wishlist, cartControl);
    const logoutGroup = document.createElement('div'); logoutGroup.className = 'logout-group';
    const logout = document.createElement('button'); logout.className = 'action-button logout-button'; logout.type = 'button'; logout.dataset.logout = 'true'; logout.textContent = 'Log out';
    cartControl.appendChild(cart); logoutGroup.appendChild(logout); actions.append(profileGroup, shoppingActions, logoutGroup);
    logout.addEventListener('click', () => {
      if (window.auth?.logout) window.auth.logout(); else { localStorage.setItem('loggedIn', 'false'); localStorage.removeItem('loggedInUser'); }
      showToast('You have been logged out.'); window.setTimeout(() => { window.location.href = 'login.html'; }, 500);
    });
    refreshHeaderCounters();
  };

  const renderGuestActions = () => {
    const actions = document.querySelector('[data-auth-actions]');
    if (!actions) return;
    actions.replaceChildren();
    const login = document.createElement('a'); login.className = 'auth-button'; login.href = 'login.html'; login.textContent = 'Log in';
    const register = document.createElement('a'); register.className = 'auth-button primary'; register.href = 'register.html'; register.textContent = 'Create account';
    actions.append(login, register);
  };

  const bindMenu = () => {
    const toggle = document.querySelector('[data-menu-toggle]'); const navigation = document.querySelector('[data-navigation]');
    if (!toggle || !navigation) return;
    const close = () => { navigation.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => { const open = navigation.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', String(open)); });
    navigation.addEventListener('click', (event) => { if (event.target.closest('a')) { navigation.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('click', (event) => { if (!navigation.contains(event.target) && !toggle.contains(event.target)) close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  };

  const bindHeaderSearch = () => {
    const input = document.querySelector('[data-header-search]');
    if (!input || document.querySelector('[data-product-search]')) return;
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && input.value.trim()) window.location.href = `index.html?search=${encodeURIComponent(input.value.trim())}#products`; });
    document.querySelector('[data-header-search-clear]')?.addEventListener('click', () => { input.value = ''; input.focus(); });
  };

  const bindLogoFallback = () => {
    const logo = document.querySelector('.brand-logo'); const fallback = document.querySelector('.brand-fallback');
    if (!logo || !logo.dataset.logoSrc) return;
    const useFallback = () => { logo.classList.add('is-missing'); logo.style.display = 'none'; if (fallback) fallback.style.display = 'block'; };
    if (window.location.protocol === 'file:') { useFallback(); return; }
    fetch(logo.dataset.logoSrc, { method: 'HEAD' }).then((response) => { if (!response.ok) throw new Error('Logo unavailable'); logo.src = logo.dataset.logoSrc; if (fallback) fallback.style.display = 'none'; }).catch(useFallback);
  };

  const renderHeader = () => { const user = parseUser(); if (user) renderAuthenticatedActions(user); else renderGuestActions(); };
  window.getCurrentUser = parseUser;
  window.refreshHeaderCounters = refreshHeaderCounters;
  window.logout = () => { if (window.auth?.logout) window.auth.logout(); else { localStorage.setItem('loggedIn', 'false'); localStorage.removeItem('loggedInUser'); } };
  window.addEventListener('luxora:cart-updated', refreshHeaderCounters);
  window.addEventListener('luxora:favorites-updated', refreshHeaderCounters);
  bindLogoFallback(); bindMenu(); bindHeaderSearch(); renderHeader();
})();
