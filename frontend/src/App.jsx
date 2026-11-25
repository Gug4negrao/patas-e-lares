import { startTransition } from 'react'
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { useSessao } from './sessao.jsx'
import Inicio from './paginas/Inicio.jsx'
import Cadastro from './paginas/Cadastro.jsx'
import Login from './paginas/Login.jsx'
import Perfil from './paginas/Perfil.jsx'

export default function App() {
  const { usuario, sair } = useSessao()
  const navegar = useNavigate()

  function encerrarSessao() {
    startTransition(() => {
      sair()
      navegar('/')
    })
  }

  return (
    <>
      <header className="topo">
        <Link to="/" className="marca">Patas & Lares</Link>
        <nav>
          <NavLink to="/" end>Início</NavLink>
          {usuario ? (
            <>
              <NavLink to="/perfil">Meu perfil</NavLink>
              <button className="link" onClick={encerrarSessao}>Sair</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Entrar</NavLink>
              <NavLink to="/cadastro">Criar conta</NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="*" element={<p>Página não encontrada.</p>} />
        </Routes>
      </main>
    </>
  )
}
