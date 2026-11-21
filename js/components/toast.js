(() => {
  'use strict';

  let timer;
  const labels = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Information' };

  const showToast = (message, type = 'info') => {
    const toast = document.querySelector('[data-toast], #toast');
    if (!toast) return;
    window.clearTimeout(timer);
    const kind = labels[type] ? type : 'info';
    toast.replaceChildren();
    toast.className = `toast toast-${kind} show`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    const messageNode = document.createElement('span');
    messageNode.textContent = message;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = '×';
    close.addEventListener('click', () => toast.classList.remove('show'));
    toast.append(messageNode, close);
    timer = window.setTimeout(() => toast.classList.remove('show'), 3200);
  };

  window.showToast = showToast;
  window.luxoraToast = {
    show: showToast,
    success: (message) => showToast(message, 'success'),
    error: (message) => showToast(message, 'error'),
    warning: (message) => showToast(message, 'warning'),
    info: (message) => showToast(message, 'info'),
  };
})();
