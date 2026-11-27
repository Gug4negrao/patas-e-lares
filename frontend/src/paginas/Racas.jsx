import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'
import { normalizar } from '../racas.js'

const POR_PAGINA = 24

// Catálogo de raças de cães. Os dados vêm da TheDogAPI, mas a tela só fala
// com o nosso backend (que guarda as raças no banco e esconde a chave).
export default function Racas() {
  const { usuario } = useSessao()
  const [racas, setRacas] = useState(null)
  const [busca, setBusca] = useState('')
  const [limite, setLimite] = useState(POR_PAGINA)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [importando, setImportando] = useState(false)

  async function carregar() {
    const especies = await api('/especies')
    const cao = especies.find((e) => normalizar(e.nome) === 'cao')
    setRacas(cao ? await api(`/racas?especie=${cao.id}`) : [])
  }

  useEffect(() => {
    carregar().catch((e) => setErro(e.message))
  }, [])

  const encontradas = useMemo(() => {
    const termo = normalizar(busca.trim())
    if (!racas || !termo) return racas ?? []
    return racas.filter(
      (r) => normalizar(r.nome).includes(termo) || normalizar(r.temperamento).includes(termo),
    )
  }, [racas, busca])

  function alterarBusca(evento) {
    setBusca(evento.target.value)
    setLimite(POR_PAGINA)
  }

  // Gestores podem pedir ao backend para buscar a lista de novo na TheDogAPI.
  async function importar() {
    setImportando(true)
    setErro('')
    setAviso('')
    try {
      const resposta = await api('/racas/sincronizar', { metodo: 'POST' })
      await carregar()
      setAviso(`${resposta.racas} raças atualizadas pela TheDogAPI.`)
    } catch (e) {
      setErro(e.message)
    } finally {
      setImportando(false)
    }
  }

  return (
    <section>
      <div className="cabecalho">
        <h1>Raças de cães</h1>
        {usuario?.tipo === 'Gestor' && (
          <div className="acoes">
            <button className="secundario" onClick={importar} disabled={importando}>
              {importando ? 'Atualizando...' : 'Atualizar pela TheDogAPI'}
            </button>
          </div>
        )}
      </div>
      <p className="detalhe">
        Conheça as raças antes de adotar. Fotos e informações da{' '}
        <a href="https://thedogapi.com" target="_blank" rel="noreferrer">TheDogAPI</a>
        {' '}(os temperamentos estão em inglês).
      </p>

      <div className="filtros">
        <input
          type="search"
          placeholder="Buscar por nome ou temperamento"
          value={busca}
          onChange={alterarBusca}
        />
        {racas?.length > 0 && (
          <span className="detalhe">{encontradas.length} de {racas.length} raças</span>
        )}
      </div>

      {erro && <p className="erro">{erro}</p>}
      {aviso && <p className="aviso">{aviso}</p>}
      {racas === null && !erro && <p className="detalhe">Carregando...</p>}
      {racas?.length === 0 && (
        <p className="detalhe">
          Nenhuma raça cadastrada ainda. Elas são importadas da TheDogAPI quando a chave
          está configurada no servidor.
        </p>
      )}
      {racas?.length > 0 && encontradas.length === 0 && (
        <p className="detalhe">Nenhuma raça encontrada para “{busca.trim()}”.</p>
      )}

      <div className="grade">
        {encontradas.slice(0, limite).map((raca) => (
          <Link key={raca.id} to={`/racas/${raca.id}`} className="ficha">
            {raca.imagemUrl
              ? <img src={raca.imagemUrl} alt={raca.nome} loading="lazy" />
              : <div className="sem-foto">Sem foto</div>}
            <div className="ficha-texto">
              <strong>{raca.nome}</strong>
              {raca.expectativaVida && <span>Vive {raca.expectativaVida}</span>}
              {raca.temperamento && <span className="detalhe resumo">{raca.temperamento}</span>}
            </div>
          </Link>
        ))}
      </div>

      {encontradas.length > limite && (
        <p className="centro">
          <button className="secundario" onClick={() => setLimite(limite + POR_PAGINA)}>
            Mostrar mais raças
          </button>
        </p>
      )}
    </section>
  )
}
