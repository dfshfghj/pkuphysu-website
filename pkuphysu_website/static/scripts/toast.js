function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function () {
  const scriptTag = document.getElementById('flask-messages');
  if (!scriptTag) return;

  const messages = JSON.parse(scriptTag.textContent);
  const toastTypes = {
    'message': 'info',
    'info': 'info',
    'success': 'success',
    'error': 'error',
    'warning': 'error'
  };

  messages.forEach(([category, msg]) => {
    const type = toastTypes[category] || 'info';
    showToast(msg, type);
  });
});