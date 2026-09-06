import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

const baseInputClasses =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50";

interface FieldWrapperProps {
  label?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, required, error, children }: FieldWrapperProps) {
  return (
    <div>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, required, className, ...rest }, ref) => (
  <FieldWrapper label={label} required={required} error={error}>
    <input ref={ref} className={clsx(baseInputClasses, error && "border-red-400", className)} {...rest} />
  </FieldWrapper>
));
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, ...rest }, ref) => (
  <FieldWrapper label={label} error={error}>
    <textarea ref={ref} className={clsx(baseInputClasses, "min-h-[80px]", error && "border-red-400", className)} {...rest} />
  </FieldWrapper>
));
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, required, className, children, ...rest }, ref) => (
  <FieldWrapper label={label} required={required} error={error}>
    <select ref={ref} className={clsx(baseInputClasses, "appearance-none bg-no-repeat", error && "border-red-400", className)} {...rest}>
      {children}
    </select>
  </FieldWrapper>
));
Select.displayName = "Select";
