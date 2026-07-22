import React from 'react';

/**
 * Reusable Card container component adhering to clean White & Blue palette.
 */
export default function Card({
  children,
  title = '',
  subtitle = '',
  footer = null,
  className = '',
  headerAction = null,
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-border shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-5 border-b border-neutral-border flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-neutral-maintext">{title}</h3>}
            {subtitle && <p className="text-sm text-neutral-subtext mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-neutral-bg/60 border-t border-neutral-border">
          {footer}
        </div>
      )}
    </div>
  );
}
