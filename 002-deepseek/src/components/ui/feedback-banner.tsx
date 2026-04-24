interface FeedbackBannerProps {
  type: "correct" | "incorrect";
  message?: string;
}

export function FeedbackBanner({ type, message }: FeedbackBannerProps) {
  const isCorrect = type === "correct";

  return (
    <div
      className="rounded-xl p-4 mb-3 animate-[fadeIn_0.3s_ease-out]"
      style={{
        background: isCorrect ? "#dcfce7" : "#fef2f2",
        color: isCorrect ? "#166534" : "#991b1b",
        border: `2px solid ${isCorrect ? "#22c55e" : "#ef4444"}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{isCorrect ? "✓" : "✗"}</span>
        <span className="font-semibold">
          {isCorrect ? "Правильно!" : "Неправильно"}
        </span>
      </div>
      {message && <p className="mt-1 text-sm opacity-80">{message}</p>}
    </div>
  );
}
