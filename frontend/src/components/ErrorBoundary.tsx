import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌❌❌ ERROR BOUNDARY CAUGHT:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
    
    // Показываем alert тоже
    alert(`ОШИБКА В КОМПОНЕНТЕ:\n\n${error.message}\n\nСмотри консоль для деталей`);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          backgroundColor: '#ff000020', 
          border: '2px solid red',
          margin: '20px',
          borderRadius: '8px'
        }}>
          <h1 style={{ color: 'red' }}>❌ Произошла ошибка</h1>
          <h2>Ошибка:</h2>
          <pre style={{ 
            backgroundColor: '#000', 
            color: '#0f0', 
            padding: '20px',
            overflow: 'auto',
            borderRadius: '4px'
          }}>
            {this.state.error?.toString()}
          </pre>
          
          <h2>Stack Trace:</h2>
          <pre style={{ 
            backgroundColor: '#000', 
            color: '#ff0', 
            padding: '20px',
            overflow: 'auto',
            fontSize: '12px',
            borderRadius: '4px'
          }}>
            {this.state.error?.stack}
          </pre>
          
          {this.state.errorInfo && (
            <>
              <h2>Component Stack:</h2>
              <pre style={{ 
                backgroundColor: '#000', 
                color: '#0ff', 
                padding: '20px',
                overflow: 'auto',
                fontSize: '12px',
                borderRadius: '4px'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </>
          )}
          
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Перезагрузить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
