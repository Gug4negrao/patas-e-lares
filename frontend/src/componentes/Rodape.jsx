import { Link } from 'react-router-dom'
import { useSessao } from '../sessao.jsx'
import Logo from './Logo.jsx'

export default function Rodape() {
  const { usuario } = useSessao()

  return (
    <footer className="rodape">
      <div className="rodape-interno">
        <div className="rodape-marca">
          <Logo tamanho={32} />
          <p>Conectando abrigos, ONGs e adotantes para que cada animal encontre um lar.</p>
        </div>
        <nav className="rodape-links" aria-label="Links do rodapé">
          <Link to="/animais">Animais para adoção</Link>
          <Link to="/racas">Catálogo de raças</Link>
          {usuario
            ? <Link to="/perfil">Meu perfil</Link>
            : <Link to="/cadastro">Criar conta</Link>}
        </nav>
        <p className="rodape-creditos">
          Informações de raças: <a href="https://thedogapi.com" target="_blank" rel="noreferrer">TheDogAPI</a>
          {' · '}
          Endereços: <a href="https://viacep.com.br" target="_blank" rel="noreferrer">ViaCEP</a>
        </p>
      </div>
    </footer>
  )
}
