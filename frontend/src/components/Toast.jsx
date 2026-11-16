import './Toast.css';

const ICONS = { success: '✓', error: '!', info: 'i' };

// Shows the list of toasts. ToastContext owns the list.
function Toast({ toasts, onClose }) {
  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-icon" aria-hidden="true">
            {ICONS[toast.type]}
          </span>
          <p className="toast-message">{toast.message}</p>
          <button
            type="button"
            className="toast-close"
            onClick={() => onClose(toast.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toast;
