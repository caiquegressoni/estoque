import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.jsx'
import { AuthSessionProvider } from './auth/AuthSessionProvider.jsx'

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE

function MissingAuth0Configuration() {
  return (
    <div style={{ padding: 24, color: '#fff', fontFamily: 'sans-serif' }}>
      Configure VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID e VITE_AUTH0_AUDIENCE para iniciar o sistema.
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {auth0Domain && auth0ClientId && auth0Audience ? (
      <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: auth0Audience,
          scope: 'openid profile email',
        }}
      >
        <AuthSessionProvider>
          <App />
        </AuthSessionProvider>
      </Auth0Provider>
    ) : <MissingAuth0Configuration />}
  </StrictMode>,
)
