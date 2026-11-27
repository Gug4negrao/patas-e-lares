import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'
import { PORTES, SEXOS, idade } from '../animais.js'

const PASSOS = [
  {
    titulo: 'Abrigos e ONGs anunciam',
    texto: 'As instituições cadastram os animais com fotos, histórico de saúde e o jeitinho de cada um.',
  },
  {
    titulo: 'Você encontra o seu par',
    texto: 'Filtre por espécie, porte, idade e cidade, e conheça o temperamento das raças no catálogo.',
  },
  {
    titulo: 'Adoção responsável',
    texto: 'A instituição avalia cada pedido de adoção e acompanha o animal no novo lar.',
  },
]

export default function Inicio() {
  const { usuario } = useSessao()
  const [recentes, setRecentes] = useState([])

  // Os animais disponíveis mais recentes (a API já devolve do mais novo ao mais antigo).
  useEffect(() => {
    api('/animais?status=Disponivel')
      .then((lista) => setRecentes(lista.slice(0, 4)))
      .catch(() => setRecentes([]))
  }, [])

  return (
    <div className="inicio">
      <section className="destaque">
        <div className="destaque-texto">
          <span className="sobretitulo">Adoção de animais</span>
          <h1>Encontre um lar para quem precisa</h1>
          <p className="destaque-sub">
            No Patas & Lares, abrigos e ONGs divulgam animais para adoção e
            adotantes encontram um novo companheiro.
          </p>
          <div className="acoes">
            <Link className="botao" to="/animais">Ver animais para adoção</Link>
            <Link className="botao botao-secundario" to="/racas">Conhecer as raças</Link>
          </div>
          {usuario ? (
            <p className="destaque-sessao">Olá, {usuario.nome}! <Link to="/perfil">Ver meu perfil</Link></p>
          ) : (
            <p className="destaque-sessao">
              <Link to="/cadastro">Crie sua conta</Link> ou <Link to="/login">entre</Link> para começar.
            </p>
          )}
        </div>
        <IlustracaoLar />
      </section>

      <section className="passos" aria-labelledby="como-funciona">
        <h2 id="como-funciona">Como funciona</h2>
        <ol>
          {PASSOS.map((passo, i) => (
            <li key={passo.titulo}>
              <span className="passo-numero">{i + 1}</span>
              <h3>{passo.titulo}</h3>
              <p>{passo.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {recentes.length > 0 && (
        <section className="recentes">
          <div className="cabecalho">
            <h2>Esperando por um lar</h2>
            <Link to="/animais">Ver todos →</Link>
          </div>
          <div className="grade">
            {recentes.map((animal) => (
              <Link key={animal.id} to={`/animais/${animal.id}`} className="ficha">
                {animal.fotoUrl
                  ? <img src={animal.fotoUrl} alt={animal.nome} loading="lazy" />
                  : <div className="sem-foto">{animal.especie.nome}</div>}
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
      )}

      {!usuario && (
        <section className="chamada">
          <div>
            <h2>É um abrigo ou ONG?</h2>
            <p>Crie uma conta de gestor, cadastre a sua instituição e divulgue os animais que esperam por uma família.</p>
          </div>
          <Link className="botao botao-claro" to="/cadastro">Cadastrar minha instituição</Link>
        </section>
      )}
    </div>
  )
}

// Ilustração da página inicial: um caminho de pegadas chegando até a casa.
function IlustracaoLar() {
  return (
    <svg className="destaque-ilustracao" viewBox="0 0 400 340" aria-hidden="true">
      <defs>
        <g id="pegada">
          <ellipse cx="0" cy="6" rx="7" ry="5.5" />
          <ellipse cx="-8.5" cy="-3" rx="2.6" ry="3.3" />
          <ellipse cx="-3" cy="-8" rx="2.7" ry="3.4" />
          <ellipse cx="3" cy="-8" rx="2.7" ry="3.4" />
          <ellipse cx="8.5" cy="-3" rx="2.6" ry="3.3" />
        </g>
      </defs>
      <path
        d="M70 70C120 8 250 0 322 52s88 160 34 222-198 74-272 30S20 132 70 70Z"
        fill="var(--cor-creme)"
      />
      <circle cx="330" cy="70" r="22" fill="var(--cor-mel)" opacity=".9" />
      {/* casa */}
      <path
        d="M228 92 312 160V262a10 10 0 0 1-10 10H154a10 10 0 0 1-10-10V160Z"
        fill="var(--cor-principal)"
        stroke="var(--cor-principal)"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path d="M210 272v-58a18 18 0 0 1 36 0v58Z" fill="var(--cor-secundaria)" />
      <rect x="168" y="176" width="30" height="30" rx="6" fill="var(--cor-fundo)" />
      <rect x="258" y="176" width="30" height="30" rx="6" fill="var(--cor-fundo)" />
      {/* coração acima do telhado */}
      <path
        d="M228 66c-6-10-24-8-24 6 0 10 14 18 24 26 10-8 24-16 24-26 0-14-18-16-24-6Z"
        fill="var(--cor-mel)"
      />
      {/* pegadas chegando à porta */}
      <g fill="var(--cor-secundaria)">
        <use href="#pegada" transform="translate(52 318) rotate(78) scale(.9)" opacity=".3" />
        <use href="#pegada" transform="translate(84 300) rotate(78) scale(.9)" opacity=".45" />
        <use href="#pegada" transform="translate(118 318) rotate(72) scale(.9)" opacity=".6" />
        <use href="#pegada" transform="translate(150 300) rotate(66) scale(.9)" opacity=".75" />
        <use href="#pegada" transform="translate(184 312) rotate(50) scale(.9)" opacity=".9" />
        <use href="#pegada" transform="translate(210 294) rotate(30) scale(.9)" />
      </g>
    </svg>
  )
}
