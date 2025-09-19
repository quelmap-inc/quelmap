import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface SettingsState {
  baseUrl: string
  apiKey: string
  setBaseUrl: (v: string) => void
  setApiKey: (v: string) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsState | null>(null)

const LS_BASE_URL_KEY = 'qm_settings_base_url'
const LS_API_KEY_KEY = 'qm_settings_api_key'

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baseUrl, setBaseUrlState] = useState<string>('')
  const [apiKey, setApiKeyState] = useState<string>('')

  // 初期化: localStorage から読み込み
  useEffect(() => {
    try {
      const storedBase = localStorage.getItem(LS_BASE_URL_KEY) || ''
      const storedKey = localStorage.getItem(LS_API_KEY_KEY) || ''
      if (storedBase) setBaseUrlState(storedBase)
      if (storedKey) setApiKeyState(storedKey)
    } catch (_) {
      // ignore
    }
  }, [])

  const setBaseUrl = useCallback((v: string) => {
    setBaseUrlState(v)
    try { localStorage.setItem(LS_BASE_URL_KEY, v) } catch (_) {}
  }, [])

  const setApiKey = useCallback((v: string) => {
    setApiKeyState(v)
    try { localStorage.setItem(LS_API_KEY_KEY, v) } catch (_) {}
  }, [])

  const resetSettings = useCallback(() => {
    setBaseUrl('http://localhost:11434')
    setApiKey('')
  }, [setBaseUrl, setApiKey])

  return (
    <SettingsContext.Provider value={{ baseUrl, apiKey, setBaseUrl, setApiKey, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
