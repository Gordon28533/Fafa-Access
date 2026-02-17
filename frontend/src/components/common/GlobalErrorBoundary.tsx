import React from 'react'

interface GlobalErrorBoundaryProps {
  children: React.ReactNode
}

interface GlobalErrorBoundaryState {
  hasError: boolean
  error?: Error | null
}

// Global error boundary to prevent hard crashes and surface a friendly fallback
export default class GlobalErrorBoundary extends React.Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log to console for debugging; wire to monitoring if available
    console.error('[GlobalErrorBoundary] Unhandled error', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.93 20h12.14a2 2 0 001.74-3l-6.07-10.5a2 2 0 00-3.48 0L4.19 17a2 2 0 001.74 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
            <p className="text-sm text-gray-600">
              The app hit an unexpected error. You can refresh to continue. If the problem persists, please contact support.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-gray-500 bg-gray-100 rounded-md p-2 break-words" aria-label="error-message">
                {this.state.error.message}
              </p>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-center gap-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Reload app
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
