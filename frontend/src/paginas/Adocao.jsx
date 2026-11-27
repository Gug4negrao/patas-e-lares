import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useSessao } from '../sessao.jsx'
import { buscarMinhaInstituicao } from '../animais.js'
import MinhasSolicitacoes from '../componentes/MinhasSolicitacoes.jsx'
import PainelSolicitacoes from '../componentes/PainelSolicitacoes.jsx'
import MeusFavoritos from '../componentes/MeusFavoritos.jsx'

// Páginas do fluxo de adoção. Elas só conferem quem está logado e entregam
// o usuário (ou a instituição) para os componentes do fluxo.

export function PaginaMinhasSolicitacoes() {
  const { usuario } = useSessao()
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.tipo !== 'Adotante') {
    return <p>Esta página é para adotantes. <Link to="/solicitacoes">Ver solicitações recebidas</Link></p>
  }
  return <MinhasSolicitacoes usuario={usuario} />
}

export function PaginaFavoritos() {
  const { usuario } = useSessao()
  if (!usuario) return <Navigate to="/login" replace />
  return <MeusFavoritos usuario={usuario} />
}

export function PaginaSolicitacoesRecebidas() {
  const { usuario } = useSessao()
  const [instituicao, setInstituicao] = useState(undefined)

  useEffect(() => {
    buscarMinhaInstituicao(usuario)
      .then(setInstituicao)
      .catch(() => setInstituicao(null))
  }, [usuario])

  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.tipo !== 'Gestor') return <p>Esta página é para gestores de abrigos e ONGs.</p>
  if (instituicao === undefined) return <p className="detalhe">Carregando...</p>
  if (instituicao === null) {
    return <p>Cadastre a sua <Link to="/instituicoes">instituição</Link> para receber solicitações.</p>
  }
  return <PainelSolicitacoes instituicaoId={instituicao.id} />
}
