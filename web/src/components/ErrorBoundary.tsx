import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Could send to error tracking service
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-950">
          <div className="rounded-lg border border-rose-500 bg-rose-500/10 p-6">
            <h2 className="text-lg font-semibold text-rose-300">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-sky-400"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

