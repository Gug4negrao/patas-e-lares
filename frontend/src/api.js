const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  let resposta
  try {
    resposta = await fetch(BASE + caminho, {
      method: metodo,
      headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.')
  }

  if (resposta.status === 204) return null

  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    throw new Error(dados?.erro ?? `Erro ${resposta.status} ao falar com o servidor.`)
  }
  return dados
}
