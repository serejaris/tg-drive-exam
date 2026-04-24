export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="inline-block border-2 border-current border-t-transparent rounded-full animate-spin"
      style={{
        width: size,
        height: size,
        color: "var(--tg-hint, #999999)",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}
