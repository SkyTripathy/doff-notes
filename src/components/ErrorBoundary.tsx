import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--bg-editor)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>
            {this.props.fallbackTitle || 'Unable to display note'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '320px' }}>
            An unexpected error occurred while rendering this view. Your note data is safe in storage.
          </p>
          <button
            className="apple-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
            }}
            onClick={this.handleReset}
          >
            <RefreshCw size={14} />
            <span>Reload Editor</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
