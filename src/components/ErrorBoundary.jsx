import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: '480px', width: '100%', backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px' }}>Đã xảy ra sự cố hiển thị</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              {this.state.error?.message || 'Có lỗi không mong muốn khi tải giao diện.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Tải lại trang
              </button>
              <button
                type="button"
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

