import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { TIPOS_REGISTRO, dataBr, hojeIso } from '../animais.js'

const VAZIO = { tipo: 'Vacina', descricao: '', realizadoEm: '', veterinario: '' }

// Histórico de saúde de um animal. Com editavel=true mostra o formulário
// para incluir, editar e remover registros.
export default function HistoricoSaude({ animalId, editavel, aoMudar }) {
  const [registros, setRegistros] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [form, setForm] = useState(VAZIO)
  const [editando, setEditando] = useState(null)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  function carregar() {
    const consulta = filtro ? `?tipo=${filtro}` : ''
    return api(`/animais/${animalId}/saude${consulta}`)
      .then(setRegistros)
      .catch((e) => setErro(e.message))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId, filtro])

  function alterar(evento) {
    setForm({ ...form, [evento.target.name]: evento.target.value })
  }

  function iniciarEdicao(registro) {
    setEditando(registro.id)
    setForm({
      tipo: registro.tipo,
      descricao: registro.descricao,
      realizadoEm: registro.realizadoEm,
      veterinario: registro.veterinario ?? '',
    })
    setErro('')
  }

  function cancelar() {
    setEditando(null)
    setForm(VAZIO)
    setErro('')
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)
    const corpo = { ...form, veterinario: form.veterinario || null }
    try {
      if (editando) await api(`/saude/${editando}`, { metodo: 'PUT', corpo })
      else await api(`/animais/${animalId}/saude`, { metodo: 'POST', corpo })
      cancelar()
      await carregar()
      if (form.tipo === 'Castracao') aoMudar?.()
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  async function remover(registro) {
    if (!confirm(`Remover o registro "${registro.descricao}"?`)) return
    try {
      await api(`/saude/${registro.id}`, { metodo: 'DELETE' })
      if (editando === registro.id) cancelar()
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className="saude">
      <div className="cabecalho">
        <h2>Histórico de saúde</h2>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPOS_REGISTRO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
      </div>

      {registros?.length === 0 && <p className="detalhe">Nenhum registro de saúde{filtro ? ' deste tipo' : ''}.</p>}
      {registros?.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Tipo</th><th>Descrição</th><th>Veterinário</th>
              {editavel && <th></th>}
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id} className={editando === r.id ? 'em-edicao' : undefined}>
                <td>{dataBr(r.realizadoEm)}</td>
                <td>{TIPOS_REGISTRO[r.tipo]}</td>
                <td>{r.descricao}</td>
                <td>{r.veterinario ?? '—'}</td>
                {editavel && (
                  <td className="acoes-linha">
                    <button className="link" onClick={() => iniciarEdicao(r)}>Editar</button>
                    <button className="link perigo-texto" onClick={() => remover(r)}>Remover</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editavel && (
        <form className="form-saude" onSubmit={salvar}>
          <h3>{editando ? 'Editar registro' : 'Novo registro'}</h3>
          <div className="linha">
            <label>
              Tipo
              <select name="tipo" value={form.tipo} onChange={alterar}>
                {Object.entries(TIPOS_REGISTRO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
              </select>
            </label>
            <label>
              Data
              <input name="realizadoEm" type="date" max={hojeIso()} value={form.realizadoEm} onChange={alterar} required />
            </label>
          </div>
          <label>
            Descrição
            <input name="descricao" placeholder="Ex.: V10, antirrábica, check-up" value={form.descricao} onChange={alterar} required />
          </label>
          <label>
            <span>Veterinário <span className="opcional">(opcional)</span></span>
            <input name="veterinario" value={form.veterinario} onChange={alterar} />
          </label>
          {erro && <p className="erro">{erro}</p>}
          <div className="acoes">
            <button type="submit" disabled={enviando}>
              {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar registro'}
            </button>
            {editando && <button type="button" className="secundario" onClick={cancelar}>Cancelar</button>}
          </div>
        </form>
      )}
      {!editavel && erro && <p className="erro">{erro}</p>}
    </div>
  )
}
