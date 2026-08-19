import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9.5' : ''
            } ${rightIcon ? 'pr-9.5' : ''} ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 text-rose-900'
                : 'border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-200'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
