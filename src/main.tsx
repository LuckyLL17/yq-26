import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { monitor } from '@/lib/monitor'
import './index.css'

monitor.init({
  enabled: import.meta.env.PROD,
  appName: 'yq-26-card-tower-defense',
  sampleRate: 1.0,
})

monitor.addBreadcrumb('app', 'Application initialized')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary componentName="App">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
