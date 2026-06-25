"use client";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 
            placeholder:text-gray-400 transition-all duration-150
            bg-white shadow-sm
            border-gray-200 hover:border-gray-300
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
            ${error ? "border-red-400 focus:ring-red-400 focus:border-red-400" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={`
            w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900
            placeholder:text-gray-400 transition-all duration-150 resize-none
            bg-white shadow-sm
            border-gray-200 hover:border-gray-300
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            ${error ? "border-red-400 focus:ring-red-400" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 bg-white
            border-gray-200 hover:border-gray-300 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            ${className}
          `}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
