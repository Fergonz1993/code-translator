// ===== PURCHASE MESSAGE COMPONENT =====
// Floating notification for purchase status (success, loading, error).

"use client";

interface PurchaseMessageProps {
    message: {
        text: string;
        type: "success" | "loading" | "error";
    };
    onDismiss: () => void;
}

export function PurchaseMessage({ message, onDismiss }: PurchaseMessageProps) {
    const bgClasses = {
        success: "bg-green-500/10 border-green-500/50 text-green-400",
        loading: "bg-blue-500/10 border-blue-500/50 text-blue-400",
        error: "bg-red-500/10 border-red-500/50 text-red-400",
    };

    return (
        <div
            className={`
        fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-2xl border flex items-center gap-3
        ${bgClasses[message.type]}
      `}
        >
            {message.type === "loading" && (
                <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    role="status"
                    aria-labelledby="spinner-title"
                    focusable="false"
                >
                    <title id="spinner-title">Loading...</title>
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            <span className="font-medium">{message.text}</span>
            {message.type !== "loading" && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="ml-2 hover:opacity-70"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
