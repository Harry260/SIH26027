import React from 'react';
import { DerivedStatus } from '../../types';
import { getStatusLabel } from '../../utils/status';

interface BadgeProps {
  status?: DerivedStatus;
  label?: string;
  variant?: 'fault' | 'degraded' | 'occupied' | 'reserved' | 'free' | 'neutral' | 'ai' | 'asset';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  variant,
  className = '',
  size = 'md',
}) => {
  const activeVariant = variant || status || 'neutral';
  const text = label || (status ? getStatusLabel(status) : '');

  const variantStyles: Record<string, string> = {
    fault: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    degraded: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    occupied: 'bg-blue-500/15 text-primary dark:text-primary-dark border-primary/30',
    reserved: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    free: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-400/30',
    neutral: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
    ai: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    asset: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-[13px] font-medium px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${
        variantStyles[activeVariant] || variantStyles.neutral
      } ${sizeStyles[size]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          activeVariant === 'fault'
            ? 'bg-red-500 animate-pulse'
            : activeVariant === 'degraded'
            ? 'bg-amber-500'
            : activeVariant === 'occupied'
            ? 'bg-primary dark:bg-primary-dark'
            : activeVariant === 'reserved'
            ? 'bg-purple-500'
            : activeVariant === 'ai'
            ? 'bg-emerald-500'
            : activeVariant === 'asset'
            ? 'bg-cyan-500'
            : 'bg-gray-400'
        }`}
      />
      {text}
    </span>
  );
};

