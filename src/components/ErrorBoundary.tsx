import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    // Actualiza el estado para que el siguiente renderizado muestre la UI alternativa
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI alternativa
      return this.props.fallback || (
        <div className="p-4 border border-red-500 rounded bg-red-50 text-red-800">
          <h2 className="text-lg font-bold mb-2">Algo salió mal</h2>
          <details className="whitespace-pre-wrap">
            <summary className="cursor-pointer font-semibold">Ver detalles del error</summary>
            <p className="mt-2">{this.state.error?.toString()}</p>
            <pre className="mt-2 text-xs overflow-auto max-h-[300px] p-2 bg-gray-100 rounded">
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
