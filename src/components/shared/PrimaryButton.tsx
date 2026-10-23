import React from 'react';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ children, icon, className = '', size = 'md', type = 'button', disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
      md: 'px-3.5 py-2 text-sm rounded-lg gap-1.5',
      lg: 'px-4 py-2.5 text-[15px] rounded-xl gap-2',
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark font-semibold flex items-center justify-center shrink-0 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:transform-none ${sizeClasses} ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';
