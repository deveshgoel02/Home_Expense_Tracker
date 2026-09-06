import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 disabled:text-slate-300",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...rest}
      />
    );
  }
);
Button.displayName = "Button";
