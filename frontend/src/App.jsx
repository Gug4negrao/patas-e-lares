import { startTransition } from 'react'
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { useSessao } from './sessao.jsx'
import Inicio from './paginas/Inicio.jsx'
import Cadastro from './paginas/Cadastro.jsx'
import Login from './paginas/Login.jsx'
import Perfil from './paginas/Perfil.jsx'
import Animais from './paginas/Animais.jsx'
import Animal from './paginas/Animal.jsx'
import AnimalForm from './paginas/AnimalForm.jsx'
import Especies from './paginas/Especies.jsx'

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
          <NavLink to="/animais" end>Adotar</NavLink>
          {usuario ? (
            <>
              {usuario.tipo === 'Gestor' && <NavLink to="/meus-animais">Meus animais</NavLink>}
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
          <Route path="/animais" element={<Animais />} />
          <Route path="/animais/novo" element={<AnimalForm />} />
          <Route path="/animais/:id" element={<Animal />} />
          <Route path="/animais/:id/editar" element={<AnimalForm />} />
          <Route path="/meus-animais" element={<Animais gestao />} />
          <Route path="/especies" element={<Especies />} />
          <Route path="*" element={<p>Página não encontrada.</p>} />
        </Routes>
      </main>
    </>
  )
}
