import React from 'react';

/**
 * Badge component — used for category tags, status labels, etc.
 * Supports custom color (from category.color) or predefined variants.
 */
export default function Badge({ label, color, variant = 'default', size = 'md', icon: Icon = null }) {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  const variants = {
    default: 'bg-neutral-bg text-neutral-subtext border border-neutral-border',
    primary: 'bg-primary-light text-primary-dark border border-primary/20',
    success: 'bg-success-light text-success border border-success/20',
    danger: 'bg-danger-light text-danger border border-danger/20',
    ai: 'bg-amber-50 text-amber-700 border border-amber-200' // Special: "AI suggested" badge
  };

  // If a custom category color is passed, generate inline style badge
  if (color) {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full ${sizes[size]} border`}
        style={{ backgroundColor: `${color}15`, color: color, borderColor: `${color}30` }}
      >
        {Icon && <Icon className="w-3 h-3 shrink-0" />}
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizes[size]} ${variants[variant] || variants.default}`}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {label}
    </span>
  );
}
