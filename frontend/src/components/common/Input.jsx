import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable Input component with label, error message, and optional left/right icons.
 */
export default function Input({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  icon: Icon = null,
  rightElement = null,
  actionRight = null,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full ${className}`}>
      {(label || actionRight) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label htmlFor={id} className="block text-[13px] font-semibold text-neutral-maintext">
              {label} {required && <span className="text-danger">*</span>}
            </label>
          )}
          {actionRight && <div>{actionRight}</div>}
        </div>
      )}
      <div className="relative rounded-xl">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-subtext">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-xl border ${
            error ? 'border-danger text-danger focus:ring-danger/20 focus:border-danger' : 'border-neutral-border text-neutral-maintext hover:border-primary/30 focus:ring-primary/15 focus:border-primary'
          } ${Icon ? 'pl-10' : 'pl-4'} ${rightElement || isPassword ? 'pr-10' : 'pr-4'} min-h-11 py-2.5 text-sm bg-white/85 placeholder-neutral-subtext/55 focus:outline-none focus:ring-[3px] transition-all duration-200 disabled:bg-neutral-bg disabled:cursor-not-allowed`}
          {...props}
        />
        {(rightElement || isPassword) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-subtext hover:text-neutral-maintext focus:outline-none p-1 rounded transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            ) : rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-danger flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
