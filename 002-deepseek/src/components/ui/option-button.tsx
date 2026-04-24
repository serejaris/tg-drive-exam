import { ButtonHTMLAttributes } from "react";

interface OptionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  state?: "default" | "selected" | "correct" | "incorrect" | "disabled";
}

export function OptionButton({
  state = "default",
  children,
  className = "",
  style,
  ...props
}: OptionButtonProps) {
  const stateStyles: Record<string, Record<string, string>> = {
    default: {
      background: "var(--tg-secondary-bg, #f4f4f5)",
      color: "var(--tg-text, #000)",
      border: "2px solid transparent",
    },
    selected: {
      background: "var(--tg-button, #2481cc)",
      color: "var(--tg-button-text, #fff)",
      border: "2px solid var(--tg-button, #2481cc)",
    },
    correct: {
      background: "#dcfce7",
      color: "#166534",
      border: "2px solid #22c55e",
    },
    incorrect: {
      background: "#fef2f2",
      color: "#991b1b",
      border: "2px solid #ef4444",
    },
    disabled: {
      background: "var(--tg-secondary-bg, #f4f4f5)",
      color: "var(--tg-hint, #999)",
      border: "2px solid transparent",
    },
  };

  const s = stateStyles[state];

  return (
    <button
      className={`w-full text-left p-4 rounded-xl text-base transition-all ${state !== "disabled" ? "active:scale-[0.98]" : ""} ${className}`}
      style={{ ...s, ...style }}
      disabled={state === "disabled"}
      {...props}
    >
      {children}
    </button>
  );
}
