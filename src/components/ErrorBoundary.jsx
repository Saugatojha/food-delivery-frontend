import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto mt-20 text-center p-6">
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">An unexpected error occurred. Please try again.</p>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-6 py-2 rounded">
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
