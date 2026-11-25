import { Link } from 'react-router-dom'
import { useSessao } from '../sessao.jsx'

export default function Inicio() {
  const { usuario } = useSessao()

  return (
    <section>
      <h1>Encontre um lar para quem precisa</h1>
      <p>
        No Patas & Lares, abrigos e ONGs divulgam animais para adoção e
        adotantes encontram um novo companheiro.
      </p>
      {usuario ? (
        <p>Olá, {usuario.nome}! <Link to="/perfil">Ver meu perfil</Link></p>
      ) : (
        <p>
          <Link to="/cadastro">Crie sua conta</Link> ou <Link to="/login">entre</Link> para começar.
        </p>
      )}
    </section>
  )
}
