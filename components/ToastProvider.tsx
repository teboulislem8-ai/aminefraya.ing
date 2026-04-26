'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ToastCtx {
  toast: (msg: string) => void
}
const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)

  const toast = useCallback((m: string) => {
    setMsg(m)
    setVisible(true)
    setTimeout(() => setVisible(false), 2800)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {visible && (
        <div style={{
          position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)',
          background: '#1A2E1A', color: 'white', padding: '9px 22px',
          borderRadius: 10, fontSize: 12, zIndex: 9999, whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {msg}
        </div>
      )}
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
