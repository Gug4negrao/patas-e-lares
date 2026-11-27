import { startTransition, useState } from 'react'
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { useSessao } from './sessao.jsx'
import Logo from './componentes/Logo.jsx'
import Rodape from './componentes/Rodape.jsx'
import Inicio from './paginas/Inicio.jsx'
import Cadastro from './paginas/Cadastro.jsx'
import Login from './paginas/Login.jsx'
import Perfil from './paginas/Perfil.jsx'
import Animais from './paginas/Animais.jsx'
import Animal from './paginas/Animal.jsx'
import AnimalForm from './paginas/AnimalForm.jsx'
import Especies from './paginas/Especies.jsx'
import Instituicoes from './paginas/Instituicoes.jsx'
import Racas from './paginas/Racas.jsx'
import Raca from './paginas/Raca.jsx'
import { PaginaFavoritos, PaginaMinhasSolicitacoes, PaginaSolicitacoesRecebidas } from './paginas/Adocao.jsx'

export default function App() {
  const { usuario, sair } = useSessao()
  const navegar = useNavigate()
  // No celular o menu fica recolhido atrás do botão "Menu".
  const [menuAberto, setMenuAberto] = useState(false)

  function encerrarSessao() {
    startTransition(() => {
      sair()
      navegar('/')
    })
  }

  return (
    <>
      <header className="topo">
        <div className="topo-interno">
          <Link to="/" className="marca" aria-label="Patas & Lares - página inicial">
            <Logo />
          </Link>
          <button
            className="menu-botao"
            aria-expanded={menuAberto}
            aria-controls="menu-principal"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            {menuAberto ? 'Fechar' : 'Menu'}
          </button>
          {/* Clicar em qualquer item fecha o menu no celular. */}
          <nav
            id="menu-principal"
            className={menuAberto ? 'aberto' : ''}
            onClick={() => setMenuAberto(false)}
          >
            <NavLink to="/" end>Início</NavLink>
            <NavLink to="/animais" end>Adotar</NavLink>
            <NavLink to="/racas">Raças</NavLink>
            {usuario ? (
              <>
                {usuario.tipo === 'Gestor' && <NavLink to="/meus-animais">Meus animais</NavLink>}
                {usuario.tipo === 'Gestor' && <NavLink to="/instituicoes">Minha instituição</NavLink>}
                {usuario.tipo === 'Gestor' && <NavLink to="/solicitacoes">Solicitações</NavLink>}
                {usuario.tipo === 'Adotante' && <NavLink to="/minhas-solicitacoes">Minhas solicitações</NavLink>}
                {usuario.tipo === 'Adotante' && <NavLink to="/favoritos">Favoritos</NavLink>}
                <NavLink to="/perfil">Meu perfil</NavLink>
                <button className="link" onClick={encerrarSessao}>Sair</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Entrar</NavLink>
                <NavLink to="/cadastro" className="nav-destaque">Criar conta</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/animais" element={<Animais />} />
          <Route path="/animais/novo" element={<AnimalForm />} />
          <Route path="/animais/:id" element={<Animal />} />
          <Route path="/animais/:id/editar" element={<AnimalForm />} />
          <Route path="/meus-animais" element={<Animais gestao />} />
          <Route path="/especies" element={<Especies />} />
          <Route path="/instituicoes" element={<Instituicoes />} />
          <Route path="/racas" element={<Racas />} />
          <Route path="/racas/:id" element={<Raca />} />
          <Route path="/minhas-solicitacoes" element={<PaginaMinhasSolicitacoes />} />
          <Route path="/favoritos" element={<PaginaFavoritos />} />
          <Route path="/solicitacoes" element={<PaginaSolicitacoesRecebidas />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </main>

      <Rodape />
    </>
  )
}

function NaoEncontrada() {
  return (
    <section className="vazio">
      <h1>Página não encontrada</h1>
      <p className="detalhe">O endereço pode ter mudado ou não existir mais.</p>
      <p><Link className="botao" to="/">Voltar para o início</Link></p>
    </section>
  )
}
