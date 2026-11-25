import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'

const VAZIO = { nome: '', email: '', senha: '', confirmacao: '', telefone: '', tipo: 'Adotante' }

export default function Cadastro() {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { entrar } = useSessao()
  const navegar = useNavigate()

  function alterar(evento) {
    setForm({ ...form, [evento.target.name]: evento.target.value })
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    if (form.senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (form.senha !== form.confirmacao) return setErro('As senhas não conferem.')

    setEnviando(true)
    try {
      const usuario = await api('/usuarios', {
        metodo: 'POST',
        corpo: {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          telefone: form.telefone || null,
          tipo: form.tipo,
        },
      })
      entrar(usuario)
      navegar('/perfil')
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="cartao">
      <h1>Criar conta</h1>
      <form onSubmit={enviar}>
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
          Senha
          <input name="senha" type="password" value={form.senha} onChange={alterar} required />
        </label>
        <label>
          Confirmar senha
          <input name="confirmacao" type="password" value={form.confirmacao} onChange={alterar} required />
        </label>

        <fieldset>
          <legend>Como você vai usar o Patas & Lares?</legend>
          <label className="opcao">
            <input type="radio" name="tipo" value="Adotante" checked={form.tipo === 'Adotante'} onChange={alterar} />
            Quero adotar
          </label>
          <label className="opcao">
            <input type="radio" name="tipo" value="Gestor" checked={form.tipo === 'Gestor'} onChange={alterar} />
            Represento um abrigo ou ONG
          </label>
        </fieldset>

        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Criar conta'}</button>
      </form>
      <p>Já tem conta? <Link to="/login">Entrar</Link></p>
    </section>
  )
}
