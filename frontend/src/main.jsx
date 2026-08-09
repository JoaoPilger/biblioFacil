import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import './styles/layout.css'
import App from './App.jsx'
import { AuthProvider } from './context/authContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'DM Sans', sans-serif",
            background: '#4a3728',
            color: '#f5ede6',
            borderRadius: '12px',
            padding: '12px 18px',
            boxShadow: '0 8px 32px rgba(74, 55, 40, 0.25)',
          },
          success: {
            iconTheme: { primary: '#4caf7d', secondary: '#f5ede6' },
          },
          error: {
            iconTheme: { primary: '#c27a60', secondary: '#f5ede6' },
          },
        }}
      />
      <App />
    </AuthProvider>
  </StrictMode>,
)
