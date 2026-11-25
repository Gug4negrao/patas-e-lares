import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'
import { PORTES, SEXOS, STATUS, buscarMinhaInstituicao, dataBr, idade } from '../animais.js'
import HistoricoSaude from '../componentes/HistoricoSaude.jsx'

export default function Animal() {
  const { id } = useParams()
  const { usuario } = useSessao()
  const navegar = useNavigate()
  const [animal, setAnimal] = useState(null)
  const [responsavel, setResponsavel] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    setAnimal(null)
    setErro('')
    api(`/animais/${id}`).then(setAnimal).catch((e) => setErro(e.message))
  }, [id])

  useEffect(() => {
    if (!animal) return
    buscarMinhaInstituicao(usuario)
      .then((inst) => setResponsavel(inst?.id === animal.instituicao.id))
      .catch(() => setResponsavel(false))
  }, [animal, usuario])

  async function mudarStatus(status) {
    setErro('')
    try {
      setAnimal(await api(`/animais/${id}/status`, { metodo: 'PATCH', corpo: { status } }))
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir() {
    if (!confirm(`Excluir ${animal.nome}? O histórico de saúde também será apagado.`)) return
    setErro('')
    try {
      await api(`/animais/${id}`, { metodo: 'DELETE' })
      navegar('/meus-animais')
    } catch (e) {
      setErro(e.message)
    }
  }

  if (!animal) return erro ? <p className="erro">{erro}</p> : <p className="detalhe">Carregando...</p>

  const podeAlternar = animal.status === 'Disponivel' || animal.status === 'Inativo'

  return (
    <section className="detalhe-animal">
      <div className="perfil-animal">
        {animal.fotoUrl
          ? <img src={animal.fotoUrl} alt={animal.nome} />
          : <div className="sem-foto grande">{animal.especie.nome ?? 'Sem foto'}</div>}

        <div>
          <h1>{animal.nome}</h1>
          <span className={`selo selo-${animal.status}`}>{STATUS[animal.status]}</span>
          <dl>
            <dt>Espécie</dt><dd>{animal.especie.nome}</dd>
            <dt>Raça</dt><dd>{animal.raca?.nome ?? 'Sem raça definida'}</dd>
            <dt>Sexo</dt><dd>{SEXOS[animal.sexo]}</dd>
            <dt>Porte</dt><dd>{PORTES[animal.porte]}</dd>
            <dt>Idade</dt>
            <dd>
              {idade(animal.nascimentoAprox)}
              {animal.nascimentoAprox && <span className="detalhe"> (nasceu por volta de {dataBr(animal.nascimentoAprox)})</span>}
            </dd>
            <dt>Castrado</dt><dd>{animal.castrado ? 'Sim' : 'Não'}</dd>
            <dt>Instituição</dt>
            <dd>
              {animal.instituicao.nome}
              {animal.instituicao.cidade && ` · ${animal.instituicao.cidade}/${animal.instituicao.uf}`}
            </dd>
          </dl>
        </div>
      </div>

      <p className="descricao">{animal.descricao}</p>

      {animal.raca && (animal.raca.temperamento || animal.raca.expectativaVida || animal.raca.imagemUrl) && (
        <div className="sobre-raca">
          {animal.raca.imagemUrl && <img src={animal.raca.imagemUrl} alt={animal.raca.nome} />}
          <div>
            <h2>Sobre a raça {animal.raca.nome}</h2>
            {animal.raca.temperamento && <p><strong>Temperamento:</strong> {animal.raca.temperamento}</p>}
            {animal.raca.expectativaVida && <p><strong>Expectativa de vida:</strong> {animal.raca.expectativaVida}</p>}
          </div>
        </div>
      )}

      {responsavel && (
        <div className="acoes">
          <Link className="botao" to={`/animais/${id}/editar`}>Editar dados</Link>
          {podeAlternar && (
            animal.status === 'Disponivel'
              ? <button className="secundario" onClick={() => mudarStatus('Inativo')}>Pausar anúncio</button>
              : <button className="secundario" onClick={() => mudarStatus('Disponivel')}>Voltar a anunciar</button>
          )}
          <button className="perigo" onClick={excluir}>Excluir</button>
        </div>
      )}
      {erro && <p className="erro">{erro}</p>}

      <HistoricoSaude
        animalId={id}
        editavel={responsavel}
        aoMudar={() => api(`/animais/${id}`).then(setAnimal).catch(() => {})}
      />
    </section>
  )
}
