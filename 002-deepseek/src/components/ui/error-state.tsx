import { Button } from "./button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Что-то пошло не так",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div
        className="text-4xl mb-4"
        style={{ color: "var(--tg-destructive, #ff3b30)" }}
      >
        !
      </div>
      <p className="mb-4" style={{ color: "var(--tg-text, #000)" }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Попробовать снова
        </Button>
      )}
    </div>
  );
}
