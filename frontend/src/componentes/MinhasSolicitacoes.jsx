import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitacoesApi } from '../api.js'
import StatusBadge from './StatusBadge.jsx'

export default function MinhasSolicitacoes({ usuario }) {
  const [itens, setItens] = useState([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      setItens(await solicitacoesApi.listar({ usuario: usuario.id }))
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [usuario.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function cancelar(id) {
    if (!window.confirm('Cancelar esta solicitação?')) return
    try {
      await solicitacoesApi.cancelar(id)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  if (carregando) return <p className="detalhe">Carregando...</p>

  return (
    <section>
      <h1>Minhas solicitações</h1>
      {erro && <p className="erro">{erro}</p>}
      {itens.length === 0 && (
        <p className="detalhe">
          Você ainda não fez nenhuma solicitação. <Link to="/animais">Ver animais para adoção</Link>
        </p>
      )}
      <ul className="lista-cartoes">
        {itens.map((s) => (
          <li key={s.id}>
            <div className="lista-cartoes-topo">
              {s.animal
                ? <Link to={`/animais/${s.animal.id}`}><strong>{s.animal.nome}</strong></Link>
                : <strong>Animal removido</strong>}
              <StatusBadge status={s.status} />
            </div>
            <div className="detalhe">
              {s.animal?.instituicao?.nome} · enviada em{' '}
              {new Date(s.criadoEm).toLocaleDateString('pt-BR')}
            </div>
            <blockquote>{s.mensagem}</blockquote>
            {s.motivoResposta && (
              <p className={s.status === 'Rejeitada' ? 'erro' : 'detalhe'}>
                Resposta da instituição: {s.motivoResposta}
              </p>
            )}
            {s.status === 'Pendente' && (
              <button className="link perigo-texto" onClick={() => cancelar(s.id)}>
                Cancelar solicitação
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
