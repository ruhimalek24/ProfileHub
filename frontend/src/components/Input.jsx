import { useState } from 'react';
import './Input.css';

// Reusable labeled input with an error message.
// Password inputs get a Show/Hide button automatically.
function Input({ label, id, name, type = 'text', error, hint, className = '', ...rest }) {
  const [showPassword, setShowPassword] = useState(false);

  const inputId = id || name;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  // Error message replaces the hint while there is one.
  let describedBy;
  if (error) describedBy = errorId;
  else if (hint) describedBy = hintId;

  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}

      <div className="input-wrap">
        <input
          id={inputId}
          name={name}
          type={inputType}
          className={`input ${error ? 'input-invalid' : ''} ${isPassword ? 'input-has-toggle' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="input-toggle"
            onClick={() => setShowPassword((show) => !show)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="field-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export default Input;
