import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { PORTES, SEXOS, idade } from '../animais.js'
import { temperamentos } from '../racas.js'

// Ficha de uma raça, com os animais dela que estão disponíveis para adoção.
export default function Raca() {
  const { id } = useParams()
  const [raca, setRaca] = useState(null)
  const [animais, setAnimais] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    // "atual" evita mostrar a resposta de uma raça anterior se o id mudar no meio.
    let atual = true
    setRaca(null)
    setAnimais(null)
    setErro('')
    api(`/racas/${id}`)
      .then((dados) => {
        if (!atual) return
        setRaca(dados)
        // Só busca os animais depois de confirmar que a raça existe.
        return api(`/animais?raca=${dados.id}&status=Disponivel`)
          .then((lista) => atual && setAnimais(lista))
          .catch(() => atual && setAnimais([]))
      })
      .catch((e) => atual && setErro(e.message))
    return () => {
      atual = false
    }
  }, [id])

  if (erro) {
    return (
      <section>
        <p className="erro">{erro}</p>
        <p><Link to="/racas">Voltar para o catálogo de raças</Link></p>
      </section>
    )
  }
  if (!raca) return <p className="detalhe">Carregando...</p>

  const lista = temperamentos(raca)

  return (
    <section>
      <p><Link to="/racas">← Todas as raças</Link></p>

      <div className="perfil-raca">
        {raca.imagemUrl
          ? <img src={raca.imagemUrl} alt={raca.nome} />
          : <div className="sem-foto grande">Sem foto</div>}
        <div>
          <h1>{raca.nome}</h1>
          <dl>
            <dt>Expectativa de vida</dt>
            <dd>{raca.expectativaVida ?? 'Não informada'}</dd>
          </dl>
          {lista.length > 0 && (
            <>
              <h2>Temperamento</h2>
              <ul className="etiquetas">
                {lista.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </>
          )}
        </div>
      </div>

      <h2>Animais desta raça para adoção</h2>
      {animais === null && <p className="detalhe">Carregando...</p>}
      {animais?.length === 0 && (
        <p className="detalhe">
          Nenhum animal desta raça disponível no momento. <Link to="/animais">Ver todos os animais</Link>
        </p>
      )}
      <div className="grade">
        {animais?.map((animal) => (
          <Link key={animal.id} to={`/animais/${animal.id}`} className="ficha">
            {animal.fotoUrl
              ? <img src={animal.fotoUrl} alt={animal.nome} loading="lazy" />
              : <div className="sem-foto">Sem foto</div>}
            <div className="ficha-texto">
              <strong>{animal.nome}</strong>
              <span>{SEXOS[animal.sexo]} · {PORTES[animal.porte]} · {idade(animal.nascimentoAprox)}</span>
              {animal.instituicao.cidade && (
                <span className="detalhe">{animal.instituicao.cidade}/{animal.instituicao.uf}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
