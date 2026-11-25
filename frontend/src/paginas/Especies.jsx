import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'

// Espécies aceitas no sistema (Cão e Gato vêm cadastradas). Gestores podem incluir outras.
export default function Especies() {
  const { usuario } = useSessao()
  const [especies, setEspecies] = useState([])
  const [nome, setNome] = useState('')
  const [editando, setEditando] = useState(null)
  const [nomeEditado, setNomeEditado] = useState('')
  const [erro, setErro] = useState('')

  function carregar() {
    return api('/especies').then(setEspecies).catch((e) => setErro(e.message))
  }

  useEffect(() => {
    carregar()
  }, [])

  async function incluir(evento) {
    evento.preventDefault()
    setErro('')
    try {
      await api('/especies', { metodo: 'POST', corpo: { nome } })
      setNome('')
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function salvar(especie) {
    setErro('')
    try {
      await api(`/especies/${especie.id}`, { metodo: 'PUT', corpo: { nome: nomeEditado } })
      setEditando(null)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(especie) {
    if (!confirm(`Excluir a espécie ${especie.nome}?`)) return
    setErro('')
    try {
      await api(`/especies/${especie.id}`, { metodo: 'DELETE' })
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const gestor = usuario?.tipo === 'Gestor'

  return (
    <section className="cartao">
      <h1>Espécies</h1>
      <ul className="lista-simples">
        {especies.map((e) => (
          <li key={e.id}>
            {editando === e.id ? (
              <>
                <input value={nomeEditado} onChange={(ev) => setNomeEditado(ev.target.value)} />
                <button className="link" onClick={() => salvar(e)}>Salvar</button>
                <button className="link" onClick={() => setEditando(null)}>Cancelar</button>
              </>
            ) : (
              <>
                <span>{e.nome}</span>
                {gestor && (
                  <span className="acoes-linha">
                    <button className="link" onClick={() => { setEditando(e.id); setNomeEditado(e.nome) }}>Renomear</button>
                    <button className="link perigo-texto" onClick={() => excluir(e)}>Excluir</button>
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {gestor && (
        <form onSubmit={incluir} className="form-linha">
          <input placeholder="Nova espécie (ex.: Coelho)" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <button type="submit">Incluir</button>
        </form>
      )}
      {erro && <p className="erro">{erro}</p>}
    </section>
  )
}
