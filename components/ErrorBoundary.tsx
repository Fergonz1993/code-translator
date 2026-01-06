// ===== ERROR BOUNDARY COMPONENT =====
// Catch and display React errors gracefully.

"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
                        {process.env.NODE_ENV === "production"
                            ? "An unexpected error occurred"
                            : this.state.error?.message || "An unexpected error occurred"}
                    </p>
                    <button
                        type="button"
                        onClick={this.handleReset}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
