import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'
import { PORTES, SEXOS, buscarMinhaInstituicao, buscarRacas, hojeIso } from '../animais.js'

const VAZIO = {
  nome: '',
  especieId: '',
  racaId: '',
  sexo: 'Macho',
  porte: 'Medio',
  nascimentoAprox: '',
  descricao: '',
  fotoUrl: '',
  castrado: false,
}

// Cadastro (rota /animais/novo) e edição (rota /animais/:id/editar) de animal.
export default function AnimalForm() {
  const { id } = useParams()
  const { usuario } = useSessao()
  const navegar = useNavigate()
  const [form, setForm] = useState(VAZIO)
  const [especies, setEspecies] = useState([])
  const [racas, setRacas] = useState([])
  const [instituicao, setInstituicao] = useState(undefined)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api('/especies')
      .then((lista) => {
        setEspecies(lista)
        if (!id && lista.length > 0) setForm((f) => (f.especieId ? f : { ...f, especieId: String(lista[0].id) }))
      })
      .catch((e) => setErro(e.message))
    buscarMinhaInstituicao(usuario)
      .then(setInstituicao)
      .catch(() => setInstituicao(null))
  }, [id, usuario])

  useEffect(() => {
    if (!id) return
    api(`/animais/${id}`)
      .then((a) => setForm({
        nome: a.nome,
        especieId: String(a.especie.id),
        racaId: a.raca ? String(a.raca.id) : '',
        sexo: a.sexo,
        porte: a.porte,
        nascimentoAprox: a.nascimentoAprox ?? '',
        descricao: a.descricao,
        fotoUrl: a.fotoUrl ?? '',
        castrado: a.castrado,
      }))
      .catch((e) => setErro(e.message))
  }, [id])

  useEffect(() => {
    buscarRacas(form.especieId).then(setRacas)
  }, [form.especieId])

  function alterar(evento) {
    const { name, value, type, checked } = evento.target
    const novo = { ...form, [name]: type === 'checkbox' ? checked : value }
    if (name === 'especieId') novo.racaId = ''
    setForm(novo)
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)
    const corpo = {
      nome: form.nome,
      especieId: Number(form.especieId),
      racaId: form.racaId ? Number(form.racaId) : null,
      sexo: form.sexo,
      porte: form.porte,
      nascimentoAprox: form.nascimentoAprox || null,
      descricao: form.descricao,
      fotoUrl: form.fotoUrl || null,
      castrado: form.castrado,
    }
    try {
      const salvo = id
        ? await api(`/animais/${id}`, { metodo: 'PUT', corpo })
        : await api('/animais', { metodo: 'POST', corpo: { ...corpo, instituicaoId: instituicao.id } })
      navegar(`/animais/${salvo.id}`)
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (usuario?.tipo !== 'Gestor') return <p>Só gestores de abrigos e ONGs cadastram animais.</p>
  if (instituicao === null) return <p>Cadastre a sua instituição antes de anunciar animais.</p>

  return (
    <section className="cartao largo">
      <h1>{id ? 'Editar animal' : 'Cadastrar animal'}</h1>
      <form onSubmit={enviar}>
        <label>
          Nome
          <input name="nome" value={form.nome} onChange={alterar} maxLength={80} required />
        </label>

        <div className="linha">
          <label>
            Espécie
            <select name="especieId" value={form.especieId} onChange={alterar} required>
              {especies.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </label>
          <label>
            <span>Raça <span className="opcional">(opcional)</span></span>
            <select name="racaId" value={form.racaId} onChange={alterar}>
              <option value="">Sem raça definida</option>
              {racas.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </label>
        </div>

        <div className="linha">
          <label>
            Sexo
            <select name="sexo" value={form.sexo} onChange={alterar}>
              {Object.entries(SEXOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
            </select>
          </label>
          <label>
            Porte
            <select name="porte" value={form.porte} onChange={alterar}>
              {Object.entries(PORTES).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
            </select>
          </label>
        </div>

        <label>
          <span>Nascimento aproximado <span className="opcional">(opcional)</span></span>
          <input name="nascimentoAprox" type="date" max={hojeIso()} value={form.nascimentoAprox} onChange={alterar} />
        </label>

        <label>
          Descrição
          <textarea
            name="descricao"
            rows={4}
            placeholder="Temperamento, se convive com outros animais, cuidados especiais..."
            value={form.descricao}
            onChange={alterar}
            required
          />
        </label>

        <label>
          <span>Link da foto <span className="opcional">(opcional)</span></span>
          <input name="fotoUrl" type="url" placeholder="https://..." value={form.fotoUrl} onChange={alterar} />
        </label>

        <label className="opcao">
          <input name="castrado" type="checkbox" checked={form.castrado} onChange={alterar} />
          Já é castrado
        </label>

        {erro && <p className="erro">{erro}</p>}
        <div className="acoes">
          <button type="submit" disabled={enviando || instituicao === undefined}>
            {enviando ? 'Salvando...' : id ? 'Salvar alterações' : 'Cadastrar'}
          </button>
          <Link to={id ? `/animais/${id}` : '/meus-animais'}>Cancelar</Link>
        </div>
      </form>
    </section>
  )
}
