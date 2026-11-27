import { useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitacoesApi } from '../api.js'

export default function BotaoQueroAdotar({ usuario, animal, onCriada }) {
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [tipoMoradia, setTipoMoradia] = useState('Casa')
  const [temOutrosAnimais, setTemOutrosAnimais] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const nova = await solicitacoesApi.criar({
        usuarioId: usuario.id,
        animalId: animal.id,
        mensagem,
        tipoMoradia,
        temOutrosAnimais,
      })
      setOk(true)
      setAberto(false)
      onCriada?.(nova)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (ok) {
    return (
      <p className="aviso">
        Solicitação enviada! Acompanhe em <Link to="/minhas-solicitacoes">Minhas solicitações</Link>.
      </p>
    )
  }

  const indisponivel = animal.status === 'Adotado' || animal.status === 'Inativo'

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} disabled={indisponivel}>
        Quero adotar
      </button>
    )
  }

  return (
    <form className="form-adocao" onSubmit={enviar}>
      <h3>Quero adotar {animal.nome}</h3>
      <label>
        Onde você mora?
        <select value={tipoMoradia} onChange={(e) => setTipoMoradia(e.target.value)}>
          <option value="Casa">Casa</option>
          <option value="Apartamento">Apartamento</option>
          <option value="Outra">Outra</option>
        </select>
      </label>
      <label className="opcao">
        <input
          type="checkbox"
          checked={temOutrosAnimais}
          onChange={(e) => setTemOutrosAnimais(e.target.checked)}
        />
        Já tenho outros animais
      </label>
      <label>
        Por que você quer adotar {animal.nome}?
        <textarea
          rows={4}
          required
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
      </label>
      {erro && <p className="erro">{erro}</p>}
      <div className="acoes">
        <button type="submit" disabled={enviando || !mensagem.trim()}>
          {enviando ? 'Enviando...' : 'Enviar solicitação'}
        </button>
        <button type="button" className="link" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
