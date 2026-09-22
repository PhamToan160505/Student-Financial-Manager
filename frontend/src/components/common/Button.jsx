import React from 'react';

/**
 * Reusable Button component with primary, secondary, danger, and success variants.
 * Follows the White & Blue design palette.
 */
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon: Icon = null,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-bg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover hover:-translate-y-0.5 focus:ring-primary shadow-sm hover:shadow-md',
    secondary: 'bg-white/80 text-neutral-maintext border border-neutral-border hover:bg-white hover:border-primary/25 focus:ring-primary shadow-xs',
    outline: 'bg-transparent text-primary border border-primary/30 hover:bg-primary-light hover:border-primary/50 focus:ring-primary',
    danger: 'bg-danger text-white hover:bg-[#A9423F] focus:ring-danger shadow-sm',
    success: 'bg-success text-white hover:bg-primary-hover focus:ring-success shadow-sm',
    ghost: 'text-neutral-subtext hover:bg-primary-light/70 hover:text-primary focus:ring-primary/30'
  };

  const sizes = {
    sm: 'min-h-8 px-3 py-1.5 text-xs gap-1.5',
    md: 'min-h-10 px-4 py-2.5 text-sm gap-2',
    lg: 'min-h-12 px-6 py-3 text-[15px] gap-2.5'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
