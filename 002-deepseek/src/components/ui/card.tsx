import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", style, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{
        background: "var(--tg-secondary-bg, #f4f4f5)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
