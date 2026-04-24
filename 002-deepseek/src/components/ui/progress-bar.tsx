interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1" style={{ color: "var(--tg-hint, #999)" }}>
        <span>{current} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "var(--tg-secondary-bg, #e5e5e5)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: "var(--tg-button, #2481cc)",
          }}
        />
      </div>
    </div>
  );
}
