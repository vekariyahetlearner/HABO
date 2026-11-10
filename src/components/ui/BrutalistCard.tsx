import React from 'react';
import { cn } from '@/lib/utils';

interface BrutalistCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  accentBarColor?: string;
  children: React.ReactNode;
}

export const BrutalistCard: React.FC<BrutalistCardProps> = ({
  interactive = false,
  accentBarColor,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        interactive ? 'neo-card-interactive' : 'neo-card',
        'p-5 relative overflow-hidden transition-all duration-200',
        className
      )}
      {...props}
    >
      {accentBarColor && (
        <div
          className="absolute top-0 left-0 right-0 h-1.5 border-b border-[var(--border-color)] opacity-80"
          style={{ backgroundColor: accentBarColor }}
        />
      )}
      {children}
    </div>
  );
};
