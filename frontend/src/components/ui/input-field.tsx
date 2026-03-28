import React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Label } from './label';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;      // Enforce REQUIRED id for accessibility & autofill
  name: string;    // Enforce REQUIRED name for frontend-to-backend binding & autofill
  label?: string;  // Explicit label text (requires htmlFor to match id)
  icon?: React.ReactNode; 
  containerClassName?: string;
  labelClassName?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      id,
      name,
      label,
      icon,
      type = "text",
      autoComplete,
      placeholder,
      className,
      containerClassName,
      labelClassName,
      required,
      ...props
    },
    ref
  ) => {
    // Fallback logic for autocomplete:
    // If autocomplete is not explicitly provided, try to infer it from the name
    // (e.g., name="email" -> autoComplete="email")
    let inferredAutoComplete = autoComplete;
    if (!inferredAutoComplete) {
      if (name.toLowerCase().includes('email')) inferredAutoComplete = 'email';
      else if (name.toLowerCase().includes('password')) inferredAutoComplete = 'current-password';
      else if (name.toLowerCase().includes('name')) inferredAutoComplete = 'name';
      else inferredAutoComplete = 'on'; // Better default than off for production
    }

    return (
      <div className={cn("space-y-1.5 relative group/input", containerClassName)}>
        {label && (
          <Label 
            htmlFor={id} 
            className={cn("text-xs font-bold uppercase tracking-widest text-slate-500", labelClassName)}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          <Input
            id={id}
            name={name}
            type={type}
            ref={ref}
            autoComplete={inferredAutoComplete}
            placeholder={placeholder}
            required={required}
            className={cn(
              "bg-slate-50 border-slate-200 h-12 text-sm font-semibold rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all",
              icon ? "pr-12" : "",
              className
            )}
            {...props}
          />
          {icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-primary transition-colors pointer-events-none">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);
InputField.displayName = "InputField";
