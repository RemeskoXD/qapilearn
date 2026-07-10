import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-500 bg-red-50 min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Něco se pokazilo.</h1>
          <p className="mb-4">Omlouváme se, došlo k chybě v aplikaci.</p>
          <pre className="text-xs text-left bg-white p-4 rounded shadow max-w-2xl overflow-auto border border-red-100">
            {this.state.error?.message}
          </pre>
          <button 
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded font-bold"
            onClick={() => window.location.reload()}
          >
            Znovu načíst stránku
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
