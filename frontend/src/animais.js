import { api } from './api.js'

// Textos que aparecem na tela para os valores fixos da API.
export const SEXOS = { Macho: 'Macho', Femea: 'Fêmea' }
export const PORTES = { Pequeno: 'Pequeno', Medio: 'Médio', Grande: 'Grande' }
export const STATUS = {
  Disponivel: 'Disponível',
  EmProcesso: 'Em processo de adoção',
  Adotado: 'Adotado',
  Inativo: 'Inativo',
}
export const TIPOS_REGISTRO = {
  Vacina: 'Vacina',
  Vermifugo: 'Vermífugo',
  Consulta: 'Consulta',
  Castracao: 'Castração',
}

export function idade(nascimento) {
  if (!nascimento) return 'Idade não informada'
  const inicio = new Date(nascimento + 'T00:00:00')
  const hoje = new Date()
  let meses = (hoje.getFullYear() - inicio.getFullYear()) * 12 + hoje.getMonth() - inicio.getMonth()
  if (hoje.getDate() < inicio.getDate()) meses -= 1
  if (meses < 1) return 'Menos de 1 mês'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

export function dataBr(data) {
  return data ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR') : ''
}

export function hojeIso() {
  const agora = new Date()
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset())
  return agora.toISOString().slice(0, 10)
}

// Instituição administrada pelo gestor logado (cadastro feito na parte de instituições).
// Devolve null se ele ainda não cadastrou nenhuma.
export async function buscarMinhaInstituicao(usuario) {
  if (usuario?.tipo !== 'Gestor') return null
  const instituicoes = await api('/instituicoes')
  return instituicoes.find((i) => i.usuarioId === usuario.id) ?? null
}

// Raças da espécie (catálogo alimentado pela TheDogAPI). Se a rota ainda não
// existir, o formulário segue funcionando sem a lista de raças.
export async function buscarRacas(especieId) {
  if (!especieId) return []
  try {
    return await api(`/racas?especie=${especieId}`)
  } catch {
    return []
  }
}
