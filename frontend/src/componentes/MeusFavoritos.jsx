import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { favoritosApi } from '../api.js'
import { PORTES, STATUS } from '../animais.js'

export default function MeusFavoritos({ usuario }) {
  const [itens, setItens] = useState([])
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    try {
      setItens(await favoritosApi.listar(usuario.id))
    } catch (e) {
      setErro(e.message)
    }
  }, [usuario.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function remover(id) {
    try {
      await favoritosApi.remover(id)
      setItens((atual) => atual.filter((f) => f.id !== id))
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <section>
      <h1>Meus favoritos</h1>
      {erro && <p className="erro">{erro}</p>}
      {itens.length === 0 && (
        <p className="detalhe">
          Você ainda não favoritou nenhum animal. <Link to="/animais">Ver animais para adoção</Link>
        </p>
      )}
      <div className="grade">
        {itens.map((f) => (
          <article key={f.id} className="ficha">
            <Link to={`/animais/${f.animal?.id}`} className="ficha-link">
              {f.animal?.fotoUrl
                ? <img src={f.animal.fotoUrl} alt={f.animal.nome} loading="lazy" />
                : <div className="sem-foto">{f.animal?.especie?.nome ?? 'Sem foto'}</div>}
              <div className="ficha-texto">
                <strong>{f.animal?.nome}</strong>
                <span>
                  {f.animal?.especie?.nome} · {PORTES[f.animal?.porte] ?? f.animal?.porte}
                </span>
                <span className="detalhe">{f.animal?.instituicao?.nome}</span>
                {f.animal?.status && (
                  <span className={`selo selo-${f.animal.status}`}>{STATUS[f.animal.status]}</span>
                )}
              </div>
            </Link>
            <div className="ficha-acoes">
              <button className="link perigo-texto" onClick={() => remover(f.id)}>Remover</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

// Para usar no card ou na página do animal.
export function BotaoFavoritar({ usuario, animalId }) {
  const [msg, setMsg] = useState('')

  async function favoritar() {
    try {
      await favoritosApi.adicionar(usuario.id, animalId)
      setMsg('Favoritado!')
    } catch (e) {
      setMsg(e.message)
    }
  }

  return (
    <>
      <button className="secundario" onClick={favoritar}>♥ Favoritar</button>
      {msg && <span className="detalhe"> {msg}</span>}
    </>
  )
}
