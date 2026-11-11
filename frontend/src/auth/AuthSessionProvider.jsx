import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { request, setAccessTokenProvider } from '../services/api'

const AuthSessionContext = createContext(null)
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

export function AuthSessionProvider({ children }) {
  const {
    getAccessTokenSilently,
    isAuthenticated,
    isLoading: authLoading,
    loginWithRedirect,
    logout: auth0Logout,
    user: auth0User,
  } = useAuth0()
  const [currentUser, setCurrentUser] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setCurrentUser(null)
      setProfileError(null)
      return
    }

    setProfileLoading(true)
    try {
      const response = await request('/users/me')
      if (!response.ok) {
        throw new Error('A conta Auth0 ainda não está associada a um usuário do Estoque.')
      }
      setCurrentUser(await response.json())
      setProfileError(null)
    } catch (error) {
      setCurrentUser(null)
      setProfileError(error.message || 'Não foi possível carregar o perfil do usuário.')
    } finally {
      setProfileLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    setAccessTokenProvider(isAuthenticated
      ? () => getAccessTokenSilently({ authorizationParams: { audience } })
      : null)

    return () => setAccessTokenProvider(null)
  }, [getAccessTokenSilently, isAuthenticated])

  useEffect(() => {
    if (!authLoading) refreshProfile()
  }, [authLoading, refreshProfile, auth0User?.sub])

  const login = useCallback(() => loginWithRedirect(), [loginWithRedirect])
  const logout = useCallback(() => auth0Logout({
    logoutParams: { returnTo: window.location.origin },
  }), [auth0Logout])

  const value = useMemo(() => ({
    isAuthenticated,
    loading: authLoading || profileLoading,
    currentUser,
    profileError,
    refreshProfile,
    login,
    logout,
  }), [isAuthenticated, authLoading, profileLoading, currentUser, profileError, refreshProfile, login, logout])

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext)
  if (!context) throw new Error('useAuthSession precisa ser usado dentro de AuthSessionProvider.')
  return context
}
