import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './styles/design-system.css'
import './styles/index.css'
import { AuthProvider } from './contexts/AuthContext'
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary'

// Initialize Datadog RUM (optional monitoring)
if (import.meta.env.VITE_DATADOG_ENABLED === 'true') {
  try {
    import('@datadog/browser-rum').then(({ datadogRum }) => {
      datadogRum.init({
        applicationId: import.meta.env.VITE_DATADOG_APP_ID || '',
        clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN || '',
        site: 'datadoghq.com',
        service: 'fafa-access-frontend',
        env: import.meta.env.MODE,
        version: '1.0.0',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input'
      });
      datadogRum.startSessionReplayRecording();
    }).catch(() => {
      // Datadog failed to load (optional)
    });
  } catch (err) {
    console.warn('[Main] Datadog initialization failed (optional)');
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </React.StrictMode>,
)
