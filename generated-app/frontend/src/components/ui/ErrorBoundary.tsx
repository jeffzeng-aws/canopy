import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8 animate-fade-in">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#BC6C25]/10 flex items-center justify-center">
              <AlertTriangle size={32} className="text-[#BC6C25]" />
            </div>
            <h2 className="text-xl font-display font-bold text-[#2D3748] dark:text-[#E8ECF4] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[#5A6578] mb-1">
              An unexpected error occurred while rendering this page.
            </p>
            {this.state.error && (
              <p className="text-xs font-mono text-[#8896A6] bg-[#f0ede8] dark:bg-[#1A1F2E] rounded-md px-3 py-2 mb-5 break-words">
                {this.state.error.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4A373] hover:bg-[#c49363] text-white rounded-lg text-sm font-medium transition-all"
              >
                <RefreshCw size={14} /> Try Again
              </button>
              <button
                onClick={this.handleHome}
                className="flex items-center gap-2 px-4 py-2 border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg text-sm text-[#5A6578] hover:bg-[#f0ede8] dark:hover:bg-[#2a3144] transition-colors"
              >
                <Home size={14} /> Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
