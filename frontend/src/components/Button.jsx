import { Link } from 'react-router-dom';
import './Button.css';

// Reusable button. Pass `to` to render a router link instead.
// variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  type = 'button',
  loading = false,
  fullWidth = false,
  disabled = false,
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className="spinner spinner-sm" aria-hidden="true" />}
      {children}
    </button>
  );
}

export default Button;
