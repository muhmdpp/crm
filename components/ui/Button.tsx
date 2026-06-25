"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
  secondary:
    "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm border border-transparent",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 rounded-md gap-1.5",
  md: "text-sm px-4 py-2 rounded-lg gap-2",
  lg: "text-sm px-5 py-2.5 rounded-lg gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1
          ${variantClasses[variant]} ${sizeClasses[size]} ${className}
        `}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
