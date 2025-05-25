// Initialize notification container when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create notification container if it doesn't exist
  if (!document.querySelector('.notification-container')) {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  // Initialize Bootstrap toasts
  const toastElList = [].slice.call(document.querySelectorAll('.toast'));
  toastElList.map(function (toastEl) {
    return new bootstrap.Toast(toastEl);
  });
});

/**
 * Show a custom notification using Bootstrap 5 Toast component
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type (success, error, warning, info, game)
 * @param {number} options.duration - Duration in milliseconds before auto-close (0 for no auto-close)
 * @param {string} options.buttonText - Text for action button (optional)
 * @param {Function} options.buttonCallback - Callback for action button (optional)
 */
function showNotification(options = {}) {
  const {
    title = '',
    message = '',
    type = 'info',
    duration = 3000,
    buttonText = '',
    buttonCallback = null,
  } = options;

  // Get the dedicated notifications container (should be included in HTML)
  let container = document.getElementById('notifications-container');
  if (!container) {
    // Fallback: create container if not found (for pages that don't include notifications.html)
    container = document.createElement('div');
    container.id = 'notifications-container';
    container.className = 'position-fixed top-0 start-50 translate-middle-x';
    container.style.cssText = `
      top: 1rem !important;
      z-index: 1055;
      width: 100%;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Map notification type to Bootstrap alert classes for better consistency
  const typeClassMap = {
    success: 'text-bg-success',
    error: 'text-bg-danger',
    warning: 'text-bg-warning',
    info: 'text-bg-info',
    game: 'text-bg-primary',
  };

  const bgClass = typeClassMap[type] || 'text-bg-light';

  // Create toast element with proper Bootstrap structure and styling
  const toastId = 'toast-' + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast ${bgClass} border-0 mb-2 showing" role="alert" aria-live="assertive" aria-atomic="true" style="pointer-events: auto;">
      <div class="toast-header ${bgClass} border-0">
        ${getIconForType(type)}
        <strong class="me-auto">${title || getDefaultTitleForType(type)}</strong>
        <small class="opacity-75">${getTimestamp()}</small>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
        ${
          buttonText
            ? `<div class="mt-2 pt-2 border-top border-light">
          <button type="button" class="btn btn-sm ${getButtonClass(type)} action-button">${buttonText}</button>
        </div>`
            : ''
        }
      </div>
    </div>
  `;

  // Add toast to container
  container.insertAdjacentHTML('beforeend', toastHtml);

  // Get the toast element
  const toastEl = document.getElementById(toastId);

  // Add action button event listener if provided
  if (buttonText && buttonCallback) {
    const button = toastEl.querySelector('.action-button');
    button.addEventListener('click', () => {
      buttonCallback();
      bootstrap.Toast.getInstance(toastEl).hide();
    });
  }

  // Initialize and show the toast
  const toast = new bootstrap.Toast(toastEl, {
    autohide: duration > 0,
    delay: duration,
  });

  toast.show();

  // Add event listener for when the toast is about to hide
  toastEl.addEventListener('hide.bs.toast', () => {
    toastEl.classList.add('hiding');
    toastEl.classList.remove('showing');
  });

  // Add event listener for when the toast is hidden
  toastEl.addEventListener('hidden.bs.toast', () => {
    if (toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
    }
  });

  return toastEl;
}

/**
 * Get appropriate button class for the notification type
 * @param {string} type - The notification type
 * @returns {string} Bootstrap button class
 */
function getButtonClass(type) {
  const buttonClasses = {
    success: 'btn-outline-light',
    error: 'btn-outline-light',
    warning: 'btn-outline-dark',
    info: 'btn-outline-light',
    game: 'btn-outline-light',
  };

  return buttonClasses[type] || 'btn-outline-primary';
}

/**
 * Get an appropriate icon for the notification type
 * @param {string} type - The notification type
 * @returns {string} HTML for the icon
 */
function getIconForType(type) {
  const icons = {
    success: '<i class="bi bi-check-circle-fill me-2"></i>',
    error: '<i class="bi bi-exclamation-triangle-fill me-2"></i>',
    warning: '<i class="bi bi-exclamation-circle-fill me-2"></i>',
    info: '<i class="bi bi-info-circle-fill me-2"></i>',
    game: '<i class="bi bi-controller me-2"></i>',
  };

  return icons[type] || icons.info;
}

/**
 * Get a default title based on notification type
 * @param {string} type - The notification type
 * @returns {string} Default title
 */
function getDefaultTitleForType(type) {
  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    game: 'Game Notification',
  };

  return titles[type] || 'Notification';
}

/**
 * Get a formatted timestamp for the notification
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Show a game notification (special styling for game events)
 * @param {string} message - The notification message
 * @param {Object} options - Additional options
 */
function showGameNotification(message, options = {}) {
  return showNotification({
    title: 'Game Notification',
    message,
    type: 'game',
    duration: 5000,
    ...options,
  });
}

/**
 * Show a success notification
 * @param {string} message - The notification message
 * @param {Object} options - Additional options
 */
function showSuccessNotification(message, options = {}) {
  return showNotification({
    title: 'Success',
    message,
    type: 'success',
    ...options,
  });
}

/**
 * Show an error notification
 * @param {string} message - The notification message
 * @param {Object} options - Additional options
 */
function showErrorNotification(message, options = {}) {
  return showNotification({
    title: 'Error',
    message,
    type: 'error',
    duration: 5000,
    ...options,
  });
}

/**
 * Show a warning notification
 * @param {string} message - The notification message
 * @param {Object} options - Additional options
 */
function showWarningNotification(message, options = {}) {
  return showNotification({
    title: 'Warning',
    message,
    type: 'warning',
    ...options,
  });
}

/**
 * Show a confirmation notification with Yes/No buttons
 * @param {string} message - The confirmation message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when canceled
 */
function showConfirmNotification(message, onConfirm, onCancel = () => {}) {
  // Get the dedicated notifications container (should be included in HTML)
  let container = document.getElementById('notifications-container');
  if (!container) {
    // Fallback: create container if not found (for pages that don't include notifications.html)
    container = document.createElement('div');
    container.id = 'notifications-container';
    container.className = 'position-fixed top-0 start-50 translate-middle-x';
    container.style.cssText = `
      top: 1rem !important;
      z-index: 1055;
      width: 100%;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Create toast element with Yes/No buttons using consistent Bootstrap styling
  const toastId = 'toast-confirm-' + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast text-bg-warning border-0 mb-2 showing" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false" style="pointer-events: auto;">
      <div class="toast-header text-bg-warning border-0">
        <i class="bi bi-question-circle-fill me-2"></i>
        <strong class="me-auto">Confirmation</strong>
        <small class="opacity-75">${getTimestamp()}</small>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
        <div class="mt-2 pt-2 border-top border-light d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-sm btn-outline-dark btn-cancel">No</button>
          <button type="button" class="btn btn-sm btn-outline-dark btn-confirm">Yes</button>
        </div>
      </div>
    </div>
  `;

  // Add toast to container
  container.insertAdjacentHTML('beforeend', toastHtml);

  // Get the toast element
  const toastEl = document.getElementById(toastId);

  // Add event listeners for buttons
  toastEl.querySelector('.btn-confirm').addEventListener('click', () => {
    bootstrap.Toast.getInstance(toastEl).hide();
    onConfirm();
  });

  toastEl.querySelector('.btn-cancel').addEventListener('click', () => {
    bootstrap.Toast.getInstance(toastEl).hide();
    onCancel();
  });

  // Add event listener for close button
  toastEl.querySelector('.btn-close').addEventListener('click', () => {
    onCancel();
  });

  // Initialize and show the toast
  const toast = new bootstrap.Toast(toastEl);
  toast.show();

  // Add event listener for when the toast is about to hide
  toastEl.addEventListener('hide.bs.toast', () => {
    toastEl.classList.add('hiding');
    toastEl.classList.remove('showing');
  });

  // Add event listener for when the toast is hidden
  toastEl.addEventListener('hidden.bs.toast', () => {
    if (toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
    }
  });

  return toastEl;
}

// Replace the browser's alert function with our custom notification
window.originalAlert = window.alert;
window.alert = function (message) {
  showNotification({
    message: message,
    type: 'info',
    duration: 5000,
  });
};
