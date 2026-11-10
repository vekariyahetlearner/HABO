import React from 'react';
import { cn } from '@/lib/utils';

interface BrutalistBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'yellow' | 'cyan' | 'purple' | 'red' | 'stone' | 'white';
  children: React.ReactNode;
}

export const BrutalistBadge: React.FC<BrutalistBadgeProps> = ({
  variant = 'green',
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    green: 'bg-[var(--accent-emerald)] text-black',
    yellow: 'bg-[var(--accent-yellow)] text-black',
    cyan: 'bg-[var(--accent-cyan)] text-black',
    purple: 'bg-[var(--accent-purple)] text-black',
    red: 'bg-[var(--accent-rose)] text-white',
    stone: 'bg-[var(--paper-subtle)] text-[var(--ink-muted)]',
    white: 'bg-[var(--paper-surface)] text-[var(--ink-primary)]',
  };

  return (
    <span
      className={cn('neo-badge', variantStyles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};
