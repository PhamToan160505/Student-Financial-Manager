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
  bodyClassName = '',
  headerAction = null,
  ...props
}) {
  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-[1.35rem] border border-white/80 shadow-sm overflow-hidden transition-[transform,box-shadow,border-color] duration-300 ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-[17px] font-bold text-neutral-maintext tracking-tight">{title}</h3>}
            {subtitle && <p className="text-sm text-neutral-subtext mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={`p-5 sm:p-6 flex-1 flex flex-col ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className="px-5 sm:px-6 py-4 bg-neutral-bg/55 border-t border-neutral-border/70">
          {footer}
        </div>
      )}
    </div>
  );
}
