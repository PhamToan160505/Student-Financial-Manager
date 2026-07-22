import React from 'react';

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
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-maintext mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-subtext">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-xl border ${
            error ? 'border-danger text-danger focus:ring-danger focus:border-danger' : 'border-neutral-border text-neutral-maintext focus:ring-primary focus:border-primary'
          } ${Icon ? 'pl-10' : 'pl-4'} ${rightElement ? 'pr-10' : 'pr-4'} py-2.5 text-sm bg-white placeholder-neutral-subtext/60 focus:outline-none focus:ring-2 transition-all disabled:bg-neutral-bg disabled:cursor-not-allowed`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
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
