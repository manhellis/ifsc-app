import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Error Details:</h2>
            <div className="bg-gray-100 p-4 rounded overflow-auto max-h-60 mb-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {this.state.error && this.state.error.toString()}
              </pre>
              {this.state.errorInfo && (
                <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-4"
              >
                Reload Page
              </button>
              <Link
                to="/"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 