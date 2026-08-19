import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-55 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2 gap-2 h-9.5',
    lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
  };

  const variantStyles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow shadow-indigo-600/20 focus:ring-indigo-500 border border-transparent',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs hover:border-slate-400 focus:ring-slate-400',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow shadow-rose-600/20 focus:ring-rose-500 border border-transparent',
    outline:
      'bg-transparent hover:bg-indigo-50 text-indigo-700 border border-indigo-300 focus:ring-indigo-500',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-300 border border-transparent',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
