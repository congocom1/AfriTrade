import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function ErrorBoundary({ fallback, children }) {
  const { t } = useTranslation();
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [errorInfo, setErrorInfo] = React.useState(null);

  const handleError = (err, info) => {
    setHasError(true);
    setError(err);
    setErrorInfo(info);
  };

  const handleRetry = () => {
    setHasError(false);
    setError(null);
    setErrorInfo(null);
  };

  // React 16+ uses static getDerivedStateFromError for rendering fallback
  // But we need componentDidCatch for side effects (logging)
  // We'll use a class component internally for error boundary mechanics
  // and wrap it with this functional component
  return (
    <ErrorBoundaryClass
      handleError={handleError}
      fallback={fallback}
      hasError={hasError}
      error={error}
      errorInfo={errorInfo}
      handleRetry={handleRetry}
      t={t}
    >
      {children}
    </ErrorBoundaryClass>
  );
}

// Internal class component that actually catches errors
class ErrorBoundaryClass extends Component {
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.handleError) {
      this.props.handleError(error, errorInfo);
    }
  }

  render() {
    const { children, fallback, hasError, error, errorInfo, handleRetry, t } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {t('errorBoundary.somethingWentWrong')}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {t('errorBoundary.tryAgain')}
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t('errorBoundary.retry')}
            </button>
            {import.meta.env.DEV && error && (
              <details className="text-left text-xs text-muted-foreground mt-4 max-w-md mx-auto">
                <summary className="cursor-pointer select-none mb-1">
                  {t('errorBoundary.details')}
                </summary>
                <pre className="overflow-auto rounded bg-muted p-3 text-[11px]">
                  {error.toString()}
                  {errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;