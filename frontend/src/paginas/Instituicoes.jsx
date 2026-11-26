
import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'
import { buscarMinhaInstituicao } from '../animais.js'

const VAZIO = {
  nome: '',
  cnpj: '',
  telefone: '',
  email: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
}

export default function Instituicoes() {
  const { usuario } = useSessao()
  const [instituicao, setInstituicao] = useState(undefined)
  const [form, setForm] = useState(VAZIO)
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [consultandoCep, setConsultandoCep] = useState(false)

  async function carregar() {
    try {
      const dados = await buscarMinhaInstituicao(usuario)
      setInstituicao(dados)

      if (dados) {
        setForm({
          nome: dados.nome ?? '',
          cnpj: dados.cnpj ?? '',
          telefone: dados.telefone ?? '',
          email: dados.email ?? '',
          cep: dados.cep ?? '',
          logradouro: dados.logradouro ?? '',
          numero: dados.numero ?? '',
          complemento: dados.complemento ?? '',
          bairro: dados.bairro ?? '',
          cidade: dados.cidade ?? '',
          uf: dados.uf ?? '',
        })
      }
    } catch (e) {
      setErro(e.message)
    }
  }

  useEffect(() => {
    carregar()
  }, [usuario])

  function alterar(evento) {
    setForm({ ...form, [evento.target.name]: evento.target.value })
  }

  async function consultarCep() {
    const cep = form.cep.replace(/\D/g, '')

    if (cep.length !== 8) {
      setErro('Digite um CEP com 8 números.')
      return
    }

    setErro('')
    setAviso('')
    setConsultandoCep(true)

    try {
      const dados = await api(`/cep/${cep}`)

      setForm((atual) => ({
        ...atual,
        cep: dados.cep ?? cep,
        logradouro: dados.logradouro ?? '',
        bairro: dados.bairro ?? '',
        cidade: dados.cidade ?? '',
        uf: dados.uf ?? '',
      }))

      setAviso('Endereço preenchido pelo CEP.')
    } catch (e) {
      setErro(e.message)
    } finally {
      setConsultandoCep(false)
    }
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    setAviso('')
    setEnviando(true)

    const corpo = {
      ...form,
      usuarioId: usuario.id,
      cnpj: form.cnpj || null,
      complemento: form.complemento || null,
      cep: form.cep.replace(/\D/g, ''),
    }

    try {
      const salvo = instituicao
        ? await api(`/instituicoes/${instituicao.id}`, {
            metodo: 'PUT',
            corpo,
          })
        : await api('/instituicoes', {
            metodo: 'POST',
            corpo,
          })

      setInstituicao(salvo)
      setEditando(false)
      setAviso('Instituição salva com sucesso!')
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  async function excluir() {
    if (!confirm(`Deseja excluir a instituição ${instituicao.nome}?`)) return

    setErro('')
    setAviso('')

    try {
      await api(`/instituicoes/${instituicao.id}`, {
        metodo: 'DELETE',
      })

      setInstituicao(null)
      setForm(VAZIO)
      setAviso('Instituição excluída com sucesso.')
    } catch (e) {
      setErro(e.message)
    }
  }

  if (usuario?.tipo !== 'Gestor') {
    return <p>Somente gestores podem cadastrar instituições.</p>
  }

  if (instituicao === undefined && !erro) {
    return <p>Carregando instituição...</p>
  }

  return (
    <section className="cartao largo">
      <h1>Minha instituição</h1>

      {instituicao && !editando ? (
        <>
          <h2>{instituicao.nome}</h2>
          <p><strong>CNPJ:</strong> {instituicao.cnpj || 'Não informado'}</p>
          <p><strong>Telefone:</strong> {instituicao.telefone}</p>
          <p><strong>E-mail:</strong> {instituicao.email}</p>
          <p>
            <strong>Endereço:</strong> {instituicao.logradouro}, {instituicao.numero}
            {instituicao.complemento ? ` - ${instituicao.complemento}` : ''}
          </p>
          <p>
            {instituicao.bairro} - {instituicao.cidade}/{instituicao.uf}
          </p>
          <p><strong>CEP:</strong> {instituicao.cep}</p>

          <div className="acoes">
            <button onClick={() => setEditando(true)}>Editar</button>
            <button className="perigo" onClick={excluir}>Excluir</button>
          </div>
        </>
      ) : (
        <>
          <p>{instituicao ? 'Altere os dados da instituição.' : 'Cadastre os dados do seu abrigo ou ONG.'}</p>

          <form onSubmit={salvar}>
            <label>
              Nome da instituição
              <input name="nome" value={form.nome} onChange={alterar} maxLength={120} required />
            </label>

            <div className="linha">
              <label>
                CNPJ (opcional)
                <input name="cnpj" value={form.cnpj} onChange={alterar} />
              </label>

              <label>
                Telefone
                <input name="telefone" value={form.telefone} onChange={alterar} required />
              </label>
            </div>

            <label>
              E-mail
              <input name="email" type="email" value={form.email} onChange={alterar} required />
            </label>

            <div className="linha">
              <label>
                CEP
                <input name="cep" value={form.cep} onChange={alterar} maxLength={9} required />
              </label>

              <button
                type="button"
                className="secundario"
                onClick={consultarCep}
                disabled={consultandoCep}
              >
                {consultandoCep ? 'Consultando...' : 'Buscar CEP'}
              </button>
            </div>

            <label>
              Logradouro
              <input name="logradouro" value={form.logradouro} onChange={alterar} required />
            </label>

            <div className="linha">
              <label>
                Número
                <input name="numero" value={form.numero} onChange={alterar} required />
              </label>

              <label>
                Complemento (opcional)
                <input name="complemento" value={form.complemento} onChange={alterar} />
              </label>
            </div>

            <label>
              Bairro
              <input name="bairro" value={form.bairro} onChange={alterar} required />
            </label>

            <div className="linha">
              <label>
                Cidade
                <input name="cidade" value={form.cidade} onChange={alterar} required />
              </label>

              <label>
                UF
                <input name="uf" value={form.uf} onChange={alterar} maxLength={2} required />
              </label>
            </div>

            {erro && <p className="erro">{erro}</p>}
            {aviso && <p className="aviso">{aviso}</p>}

            <div className="acoes">
              <button type="submit" disabled={enviando}>
                {enviando ? 'Salvando...' : 'Salvar instituição'}
              </button>

              {instituicao && (
                <button
                  type="button"
                  className="secundario"
                  onClick={() => {
                    setEditando(false)
                    setErro('')
                    carregar()
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </>
      )}

      {erro && instituicao && !editando && <p className="erro">{erro}</p>}
      {aviso && instituicao && !editando && <p className="aviso">{aviso}</p>}
    </section>
  )
}

