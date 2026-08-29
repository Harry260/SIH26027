import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark-utility' | 'pearl' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-normal transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 disabled:opacity-45 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none';

  const variantStyles = {
    primary:
      'bg-primary hover:bg-primary-hover text-white rounded-full shadow-sm font-medium',
    secondary:
      'bg-transparent hover:bg-primary/10 text-primary dark:text-primary-dark border border-primary dark:border-primary-dark rounded-full font-medium',
    'dark-utility':
      'bg-ink hover:bg-zinc-800 text-white dark:bg-surface-tile2 dark:hover:bg-zinc-700 dark:text-white rounded-md border border-white/10 text-sm font-normal',
    pearl:
      'bg-surface-pearl hover:bg-white text-ink-muted80 dark:bg-surface-tile1 dark:hover:bg-surface-tile2 dark:text-white rounded-md border border-divider-soft dark:border-white/10 text-sm',
    ghost:
      'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-ink dark:text-white rounded-full',
    icon:
      'bg-surface-chip hover:bg-surface-chip/90 dark:bg-surface-chipDark text-ink dark:text-white rounded-full border border-black/5 dark:border-white/10 w-10 h-10 p-0',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[30px]',
    md: 'text-sm px-4 py-2 min-h-[38px]',
    lg: 'text-[15px] px-6 py-2.5 min-h-[44px]',
  };

  const activeSizeStyle = variant === 'icon' ? '' : sizeStyles[size];

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${activeSizeStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

