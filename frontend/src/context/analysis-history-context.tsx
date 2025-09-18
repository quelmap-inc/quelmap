import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface AnalysisHistoryContextType {  
  history: AnalysisHistoryItem[]  
  addToHistory: (id: string, query: string) => void  
  removeFromHistory: (id: string) => void  
  clearHistory: () => void  
  setItemLoading: (id: string, isLoading: boolean) => void  
}

const AnalysisHistoryCtx = createContext<AnalysisHistoryContextType| null>(null)

export const AnalysisHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useAnalysisHistory()
  return <AnalysisHistoryCtx.Provider value={value}>{children}</AnalysisHistoryCtx.Provider>
}
/**
 *  `history`を全域範囲に統一する. 
*/
export const useSharedAnalysisHistory = () => {
  const ctx = useContext(AnalysisHistoryCtx)
  if (!ctx) throw new Error('useSharedAnalysisHistory must be used within Provider')
  return ctx
}

export interface AnalysisHistoryItem {
  id: string
  query: string
  timestamp: number
  isLoading: boolean
}

const STORAGE_KEY = 'analysis_history'
const MAX_HISTORY_ITEMS = 1000

const useAnalysisHistory = () => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([])

  // ローカルストレージから履歴を読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedHistory = JSON.parse(stored) as AnalysisHistoryItem[]
        setHistory(parsedHistory)
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error)
    }
  }, [])

  // 履歴をローカルストレージに保存
  const saveToStorage = useCallback((newHistory: AnalysisHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
    } catch (error) {
      console.error('Failed to save analysis history:', error)
    }
  }, [])

  // 新しい分析を履歴に追加
  const addToHistory = useCallback((id: string, query: string) => {
    const newItem: AnalysisHistoryItem = {
      id,
      query: query.length > 50 ? query.substring(0, 50) + '...' : query,
      timestamp: Date.now(),
      isLoading: true
    }

      setHistory((prevHistory) => {
        // 同じIDがある場合は削除（重複を避ける）
        const filteredHistory = prevHistory.filter((item) => item.id !== id)

        // 新しいアイテムを先頭に追加し、最大数を超えたら古いものを削除
        const newHistory = [newItem, ...filteredHistory].slice(
          0,
          MAX_HISTORY_ITEMS
        )

        // 先にストレージに保存
        saveToStorage(newHistory)

        // デバッグ用のログ
        console.log('Analysis history updated:', {
          newItem,
          previousCount: prevHistory.length,
          newCount: newHistory.length,
        })

        return newHistory
      })

  }, [saveToStorage])

  // 履歴から特定のアイテムを削除
  const removeFromHistory = useCallback(
    (id: string) => {
      setHistory((prevHistory) => {
        const newHistory = prevHistory.filter((item) => item.id !== id)
        saveToStorage(newHistory)
        return newHistory
      })
    },
    [saveToStorage]
  )

  // 履歴をクリア
  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear analysis history:', error)
    }
  }, [saveToStorage])

  // ローダーアイコン制御するbooleanの値を更新
  const setItemLoading = useCallback((id: string, isLoading: boolean) => {
    setHistory(prev => {
      const newHistory = prev.map(item =>
        item.id === id
        ? {...item, isLoading: isLoading}
        : item
      )
      saveToStorage(newHistory)
      return newHistory
    })
  }, [saveToStorage])

  return {
    history,
    setItemLoading,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
}
