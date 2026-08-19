import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className = '', id, required, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700">
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-2xs">
          <select
            ref={ref}
            id={selectId}
            required={required}
            className={`w-full appearance-none rounded-lg border bg-white px-3.5 py-2 pr-10 text-sm text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 text-rose-900'
                : 'border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-200'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
