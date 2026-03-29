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
            className={cn("text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground/60", labelClassName)}
          >
            {label}
            {required && <span className="text-red-500/80 ml-1">*</span>}
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
              "bg-secondary/30 border-border h-12 text-sm font-semibold rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all placeholder:text-muted-foreground/20 placeholder:font-bold placeholder:uppercase placeholder:tracking-widest",
              icon ? "pr-12" : "",
              className
            )}
            {...props}
          />
          {icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/20 group-focus-within/input:text-primary transition-colors pointer-events-none">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);
InputField.displayName = "InputField";
