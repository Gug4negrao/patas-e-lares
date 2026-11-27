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

// Fluxo de adoção e favoritos (Júlia Rodrigues). Usam a mesma função api()
// das outras telas, então herdam a URL base e as mensagens de erro.
export const solicitacoesApi = {
  // dados: { usuarioId, animalId, mensagem, tipoMoradia, temOutrosAnimais }
  criar: (dados) => api('/solicitacoes', { metodo: 'POST', corpo: dados }),
  listar: (filtros = {}) => api(`/solicitacoes?${new URLSearchParams(filtros)}`),
  cancelar: (id) => api(`/solicitacoes/${id}`, { metodo: 'DELETE' }),
  aprovar: (id) => api(`/solicitacoes/${id}/aprovar`, { metodo: 'PATCH' }),
  rejeitar: (id, motivo) =>
    api(`/solicitacoes/${id}/rejeitar`, { metodo: 'PATCH', corpo: { motivo } }),
}

export const adocoesApi = {
  listar: (filtros = {}) => api(`/adocoes?${new URLSearchParams(filtros)}`),
  atualizar: (id, dados) => api(`/adocoes/${id}`, { metodo: 'PUT', corpo: dados }),
}

export const favoritosApi = {
  listar: (usuarioId) => api(`/usuarios/${usuarioId}/favoritos`),
  adicionar: (usuarioId, animalId) =>
    api(`/usuarios/${usuarioId}/favoritos`, { metodo: 'POST', corpo: { animalId } }),
  remover: (favoritoId) => api(`/favoritos/${favoritoId}`, { metodo: 'DELETE' }),
}
