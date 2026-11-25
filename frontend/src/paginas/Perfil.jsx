import { startTransition, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'

export default function Perfil() {
  const { usuario } = useSessao()
  if (!usuario) return <Navigate to="/login" replace />
  return <FormularioPerfil usuario={usuario} />
}

function FormularioPerfil({ usuario }) {
  const { entrar, sair } = useSessao()
  const navegar = useNavigate()
  const [form, setForm] = useState({
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone ?? '',
    novaSenha: '',
  })
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  function alterar(evento) {
    setForm({ ...form, [evento.target.name]: evento.target.value })
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    setAviso('')
    if (form.novaSenha && form.novaSenha.length < 6) {
      return setErro('A nova senha precisa ter pelo menos 6 caracteres.')
    }

    setEnviando(true)
    try {
      const atualizado = await api(`/usuarios/${usuario.id}`, {
        metodo: 'PUT',
        corpo: {
          nome: form.nome,
          email: form.email,
          telefone: form.telefone || null,
          senha: form.novaSenha || null,
        },
      })
      entrar(atualizado)
      setForm({ ...form, novaSenha: '' })
      setAviso('Dados atualizados.')
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  async function excluirConta() {
    if (!window.confirm('Tem certeza que quer excluir sua conta? Essa ação não pode ser desfeita.')) return
    setErro('')
    setAviso('')
    try {
      await api(`/usuarios/${usuario.id}`, { metodo: 'DELETE' })
      startTransition(() => {
        sair()
        navegar('/')
      })
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <section className="cartao">
      <h1>Meu perfil</h1>
      <p className="detalhe">
        Conta de {usuario.tipo === 'Gestor' ? 'abrigo/ONG' : 'adotante'} desde{' '}
        {new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}
      </p>

      <form onSubmit={salvar}>
        <label>
          Nome
          <input name="nome" value={form.nome} onChange={alterar} required />
        </label>
        <label>
          E-mail
          <input name="email" type="email" value={form.email} onChange={alterar} required />
        </label>
        <label>
          <span>Telefone <span className="opcional">(opcional)</span></span>
          <input name="telefone" value={form.telefone} onChange={alterar} />
        </label>
        <label>
          <span>Nova senha <span className="opcional">(deixe em branco para manter a atual)</span></span>
          <input name="novaSenha" type="password" value={form.novaSenha} onChange={alterar} />
        </label>

        {erro && <p className="erro">{erro}</p>}
        {aviso && <p className="aviso">{aviso}</p>}
        <button type="submit" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar alterações'}</button>
      </form>

      <hr />
      <button className="perigo" onClick={excluirConta}>Excluir minha conta</button>
    </section>
  )
}
