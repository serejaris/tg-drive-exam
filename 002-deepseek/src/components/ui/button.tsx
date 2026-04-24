import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  style,
  ...props
}: ButtonProps) {
  const base =
    "rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  const variants = {
    primary: {
      background: "var(--tg-button, #2481cc)",
      color: "var(--tg-button-text, #ffffff)",
    },
    secondary: {
      background: "var(--tg-secondary-bg, #f4f4f5)",
      color: "var(--tg-text, #000000)",
    },
    danger: {
      background: "var(--tg-destructive, #ff3b30)",
      color: "#ffffff",
    },
    ghost: {
      background: "transparent",
      color: "var(--tg-link, #2481cc)",
    },
  };

  const v = variants[variant];

  return (
    <button
      className={`${base} ${sizes[size]} ${className}`}
      style={{ background: v.background, color: v.color, ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
