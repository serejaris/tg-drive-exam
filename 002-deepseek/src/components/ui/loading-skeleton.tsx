export function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Image placeholder */}
      <div
        className="w-full h-48 rounded-xl"
        style={{ background: "var(--tg-secondary-bg, #e5e5e5)" }}
      />

      {/* Question placeholder */}
      <div className="space-y-2">
        <div
          className="h-5 w-3/4 rounded"
          style={{ background: "var(--tg-secondary-bg, #e5e5e5)" }}
        />
        <div
          className="h-5 w-1/2 rounded"
          style={{ background: "var(--tg-secondary-bg, #e5e5e5)" }}
        />
      </div>

      {/* Options placeholder */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-14 w-full rounded-xl"
          style={{ background: "var(--tg-secondary-bg, #e5e5e5)" }}
        />
      ))}
    </div>
  );
}
