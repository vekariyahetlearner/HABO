'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'yellow' | 'cyan' | 'purple' | 'danger' | 'white';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[var(--accent-emerald)] text-black hover:opacity-90',
    secondary: 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:opacity-90',
    yellow: 'bg-[var(--accent-yellow)] text-black hover:opacity-90',
    cyan: 'bg-[var(--accent-cyan)] text-black hover:opacity-90',
    purple: 'bg-[var(--accent-purple)] text-black hover:opacity-90',
    danger: 'bg-[var(--accent-rose)] text-white hover:opacity-90',
    white: 'bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:bg-[var(--paper-subtle)]',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  return (
    <button
      className={cn(
        'neo-btn transition-all duration-150',
        variantStyles[variant],
        sizeStyles[size],
        props.disabled && 'opacity-50 cursor-not-allowed transform-none shadow-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
