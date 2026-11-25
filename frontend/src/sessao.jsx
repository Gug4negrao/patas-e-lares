import { createContext, useContext, useState } from 'react'

const CHAVE = 'patas-e-lares:usuario'
const SessaoContext = createContext(null)

function lerUsuarioSalvo() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE))
  } catch {
    return null
  }
}

export function SessaoProvider({ children }) {
  const [usuario, setUsuario] = useState(lerUsuarioSalvo)

  function entrar(dados) {
    localStorage.setItem(CHAVE, JSON.stringify(dados))
    setUsuario(dados)
  }

  function sair() {
    localStorage.removeItem(CHAVE)
    setUsuario(null)
  }

  return (
    <SessaoContext.Provider value={{ usuario, entrar, sair }}>
      {children}
    </SessaoContext.Provider>
  )
}

export function useSessao() {
  return useContext(SessaoContext)
}
