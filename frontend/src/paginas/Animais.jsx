import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'
import { PORTES, SEXOS, STATUS, buscarMinhaInstituicao, idade } from '../animais.js'

const FILTROS_VAZIOS = { busca: '', especie: '', sexo: '', porte: '', cidade: '', uf: '', status: '' }

// Catálogo público (só animais disponíveis) ou, com gestao=true,
// a lista de todos os animais da instituição do gestor logado.
export default function Animais({ gestao = false }) {
  const { usuario } = useSessao()
  const [especies, setEspecies] = useState([])
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
  const [instituicao, setInstituicao] = useState(undefined)
  const [animais, setAnimais] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api('/especies').then(setEspecies).catch((e) => setErro(e.message))
  }, [])

  useEffect(() => {
    if (!gestao) return
    buscarMinhaInstituicao(usuario)
      .then(setInstituicao)
      .catch(() => setInstituicao(null))
  }, [gestao, usuario])

  useEffect(() => {
    if (gestao && !instituicao) return
    const params = new URLSearchParams()
    for (const [chave, valor] of Object.entries(filtros)) {
      if (valor.trim()) params.set(chave, valor.trim())
    }
    if (gestao) params.set('instituicao', instituicao.id)
    else params.set('status', 'Disponivel')

    let atual = true
    const espera = setTimeout(() => {
      api('/animais?' + params)
        .then((lista) => atual && (setAnimais(lista), setErro('')))
        .catch((e) => atual && setErro(e.message))
    }, 250)
    return () => {
      atual = false
      clearTimeout(espera)
    }
  }, [filtros, gestao, instituicao])

  function alterar(evento) {
    setFiltros({ ...filtros, [evento.target.name]: evento.target.value })
  }

  if (gestao && usuario?.tipo !== 'Gestor') {
    return <p>Esta página é para gestores de abrigos e ONGs.</p>
  }
  if (gestao && instituicao === null) {
    return <p>Cadastre a sua instituição antes de anunciar animais.</p>
  }

  return (
    <section>
      <div className="cabecalho">
        <h1>{gestao ? `Animais de ${instituicao?.nome ?? '...'}` : 'Animais para adoção'}</h1>
        {gestao && (
          <div className="acoes">
            <Link to="/especies">Espécies</Link>
            <Link className="botao" to="/animais/novo">Cadastrar animal</Link>
          </div>
        )}
      </div>

      <div className="filtros">
        <input name="busca" placeholder="Buscar pelo nome" value={filtros.busca} onChange={alterar} />
        <select name="especie" value={filtros.especie} onChange={alterar}>
          <option value="">Todas as espécies</option>
          {especies.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select name="sexo" value={filtros.sexo} onChange={alterar}>
          <option value="">Macho ou fêmea</option>
          {Object.entries(SEXOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
        <select name="porte" value={filtros.porte} onChange={alterar}>
          <option value="">Qualquer porte</option>
          {Object.entries(PORTES).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
        {gestao ? (
          <select name="status" value={filtros.status} onChange={alterar}>
            <option value="">Qualquer situação</option>
            {Object.entries(STATUS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
        ) : (
          <>
            <input name="cidade" placeholder="Cidade" value={filtros.cidade} onChange={alterar} />
            <input name="uf" placeholder="UF" maxLength={2} value={filtros.uf} onChange={alterar} className="curto" />
          </>
        )}
        <button className="link" onClick={() => setFiltros(FILTROS_VAZIOS)}>Limpar filtros</button>
      </div>

      {erro && <p className="erro">{erro}</p>}
      {animais === null && !erro && <p className="detalhe">Carregando...</p>}
      {animais?.length === 0 && <p className="detalhe">Nenhum animal encontrado com esses filtros.</p>}

      <div className="grade">
        {animais?.map((animal) => (
          <Link key={animal.id} to={`/animais/${animal.id}`} className="ficha">
            {animal.fotoUrl
              ? <img src={animal.fotoUrl} alt={animal.nome} />
              : <div className="sem-foto">{animal.especie.nome ?? 'Sem foto'}</div>}
            <div className="ficha-texto">
              <strong>{animal.nome}</strong>
              <span>
                {animal.especie.nome}{animal.raca ? ` · ${animal.raca.nome}` : ''} · {SEXOS[animal.sexo]}
              </span>
              <span>{PORTES[animal.porte]} · {idade(animal.nascimentoAprox)}</span>
              {animal.instituicao.cidade && (
                <span className="detalhe">{animal.instituicao.cidade}/{animal.instituicao.uf}</span>
              )}
              {gestao && <span className={`selo selo-${animal.status}`}>{STATUS[animal.status]}</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
