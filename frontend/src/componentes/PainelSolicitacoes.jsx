import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitacoesApi } from '../api.js'
import StatusBadge from './StatusBadge.jsx'

const MORADIAS = { Casa: 'Casa', Apartamento: 'Apartamento', Outra: 'Outra' }

function CartaoSolicitacao({ s, onAtualizar, onErro }) {
  const [rejeitando, setRejeitando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function executar(acao) {
    setOcupado(true)
    try {
      await acao()
      await onAtualizar()
    } catch (e) {
      onErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <li>
      <div className="lista-cartoes-topo">
        {s.animal
          ? <Link to={`/animais/${s.animal.id}`}><strong>{s.animal.nome}</strong></Link>
          : <strong>Animal removido</strong>}
        <StatusBadge status={s.status} />
      </div>
      <div>
        Adotante: <strong>{s.usuario?.nome}</strong> ({s.usuario?.email}
        {s.usuario?.telefone ? `, ${s.usuario.telefone}` : ''})
      </div>
      <div className="detalhe">
        Moradia: {MORADIAS[s.tipoMoradia] ?? s.tipoMoradia} ·{' '}
        {s.temOutrosAnimais ? 'Tem outros animais' : 'Não tem outros animais'} · enviada em{' '}
        {new Date(s.criadoEm).toLocaleDateString('pt-BR')}
      </div>
      <blockquote>{s.mensagem}</blockquote>

      {s.status === 'Pendente' && !rejeitando && (
        <div className="acoes">
          <button disabled={ocupado} onClick={() => executar(() => solicitacoesApi.aprovar(s.id))}>
            Aprovar
          </button>
          <button className="perigo" disabled={ocupado} onClick={() => setRejeitando(true)}>
            Rejeitar
          </button>
        </div>
      )}

      {rejeitando && (
        <div className="acoes">
          <input
            className="campo-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo da rejeição"
          />
          <button
            className="perigo"
            disabled={ocupado || !motivo.trim()}
            onClick={() => executar(() => solicitacoesApi.rejeitar(s.id, motivo))}
          >
            Confirmar
          </button>
          <button className="link" onClick={() => setRejeitando(false)}>Voltar</button>
        </div>
      )}

      {s.motivoResposta && <p className="detalhe">Motivo: {s.motivoResposta}</p>}
    </li>
  )
}

export default function PainelSolicitacoes({ instituicaoId }) {
  const [status, setStatus] = useState('Pendente')
  const [itens, setItens] = useState([])
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    try {
      setErro('')
      const filtros = { instituicao: instituicaoId }
      if (status) filtros.status = status
      setItens(await solicitacoesApi.listar(filtros))
    } catch (e) {
      setErro(e.message)
    }
  }, [instituicaoId, status])

  useEffect(() => {
    carregar()
  }, [carregar])

  return (
    <section>
      <div className="cabecalho">
        <h1>Solicitações recebidas</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por situação">
          <option value="Pendente">Pendentes</option>
          <option value="Aprovada">Aprovadas</option>
          <option value="Rejeitada">Rejeitadas</option>
          <option value="Cancelada">Canceladas</option>
          <option value="">Todas</option>
        </select>
      </div>
      {erro && <p className="erro">{erro}</p>}
      {itens.length === 0 && <p className="detalhe">Nenhuma solicitação nesse filtro.</p>}
      <ul className="lista-cartoes">
        {itens.map((s) => (
          <CartaoSolicitacao key={s.id} s={s} onAtualizar={carregar} onErro={setErro} />
        ))}
      </ul>
    </section>
  )
}
