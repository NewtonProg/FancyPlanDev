import { Component, ReactNode } from 'react'
import { withTranslation, WithTranslation } from 'react-i18next'

interface OwnProps { children: ReactNode; label?: string }
type Props = OwnProps & WithTranslation
interface State { error: Error | null }

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render(): ReactNode {
    const { t } = this.props
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <p className="text-red-500 font-medium text-sm">
            {this.props.label ?? t('error.viewError')}
          </p>
          <p className="text-xs text-apple-gray-400 max-w-sm font-mono">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-1.5 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600">
            {t('error.reload')}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default withTranslation()(ErrorBoundary)
