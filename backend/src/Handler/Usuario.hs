{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE OverloadedRecordDot #-}
module Handler.Usuario
    ( getUsuariosR
    , postUsuariosR
    , getUsuarioR
    , putUsuarioR
    , deleteUsuarioR
    , postLoginR
    , usuarioJson
    ) where

import Control.Monad (when)
import Data.Maybe (isJust)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (getCurrentTime)
import Database.Persist
import GHC.Generics (Generic)
import Network.HTTP.Types.Status
import Yesod.Core
import Yesod.Persist.Core (runDB)

import Foundation
import Handler.Comum
import Models
import Senha
import Tipos

data NovoUsuario = NovoUsuario
    { nome     :: Text
    , email    :: Text
    , senha    :: Text
    , telefone :: Maybe Text
    , tipo     :: TipoUsuario
    } deriving Generic

data DadosUsuario = DadosUsuario
    { nome     :: Text
    , email    :: Text
    , telefone :: Maybe Text
    , senha    :: Maybe Text
    } deriving Generic

data Credenciais = Credenciais
    { email :: Text
    , senha :: Text
    } deriving Generic

instance FromJSON NovoUsuario
instance FromJSON DadosUsuario
instance FromJSON Credenciais

usuarioJson :: Entity Usuario -> Value
usuarioJson (Entity usuarioId usuario) = object
    [ "id"       .= usuarioId
    , "nome"     .= usuarioNome usuario
    , "email"    .= usuarioEmail usuario
    , "telefone" .= usuarioTelefone usuario
    , "tipo"     .= usuarioTipo usuario
    , "criadoEm" .= usuarioCriadoEm usuario
    ]

getUsuariosR :: Handler Value
getUsuariosR = do
    usuarios <- runDB $ selectList [] [Asc UsuarioNome]
    return $ toJSON (map usuarioJson usuarios)

postUsuariosR :: Handler Value
postUsuariosR = do
    dados <- lerJson :: Handler NovoUsuario
    let nomeLimpo  = T.strip dados.nome
        emailLimpo = normalizarEmail dados.email
    validarNome nomeLimpo
    validarEmail emailLimpo
    validarSenha dados.senha
    emailDisponivel emailLimpo Nothing
    hash <- criarHash dados.senha
    agora <- liftIO getCurrentTime
    let usuario = Usuario
            { usuarioNome      = nomeLimpo
            , usuarioEmail     = emailLimpo
            , usuarioSenhaHash = hash
            , usuarioTelefone  = textoOpcional dados.telefone
            , usuarioTipo      = dados.tipo
            , usuarioCriadoEm  = agora
            }
    usuarioId <- runDB $ insert usuario
    sendStatusJSON status201 (usuarioJson (Entity usuarioId usuario))

getUsuarioR :: UsuarioId -> Handler Value
getUsuarioR usuarioId = do
    usuario <- encontrarOu404 "Usuário não encontrado." usuarioId
    return $ usuarioJson (Entity usuarioId usuario)

putUsuarioR :: UsuarioId -> Handler Value
putUsuarioR usuarioId = do
    atual <- encontrarOu404 "Usuário não encontrado." usuarioId
    dados <- lerJson :: Handler DadosUsuario
    let nomeLimpo  = T.strip dados.nome
        emailLimpo = normalizarEmail dados.email
    validarNome nomeLimpo
    validarEmail emailLimpo
    emailDisponivel emailLimpo (Just usuarioId)
    hash <- case dados.senha of
        Nothing        -> return (usuarioSenhaHash atual)
        Just novaSenha -> validarSenha novaSenha >> criarHash novaSenha
    let usuario = atual
            { usuarioNome      = nomeLimpo
            , usuarioEmail     = emailLimpo
            , usuarioTelefone  = textoOpcional dados.telefone
            , usuarioSenhaHash = hash
            }
    runDB $ replace usuarioId usuario
    return $ usuarioJson (Entity usuarioId usuario)

deleteUsuarioR :: UsuarioId -> Handler Value
deleteUsuarioR usuarioId = do
    _ <- encontrarOu404 "Usuário não encontrado." usuarioId
    instituicao <- runDB $ getBy (UniqueInstituicaoUsuario usuarioId)
    when (isJust instituicao) $
        erroJson status409 "Este usuário administra uma instituição. Exclua a instituição antes."
    solicitacoes <- runDB $ count [SolicitacaoAdocaoUsuarioId ==. usuarioId]
    when (solicitacoes > 0) $
        erroJson status409 "Este usuário tem solicitações de adoção e não pode ser excluído."
    runDB $ delete usuarioId
    responderSemConteudo

postLoginR :: Handler Value
postLoginR = do
    credenciais <- lerJson :: Handler Credenciais
    encontrado <- runDB $ getBy (UniqueEmail (normalizarEmail credenciais.email))
    case encontrado of
        Just entidade@(Entity _ usuario)
            | senhaConfere credenciais.senha (usuarioSenhaHash usuario) ->
                return (usuarioJson entidade)
        _ -> erroJson status401 "E-mail ou senha incorretos."

validarNome :: Text -> Handler ()
validarNome nomeLimpo = exigir (not (T.null nomeLimpo)) "Informe o nome."

validarEmail :: Text -> Handler ()
validarEmail emailLimpo = exigir (emailValido emailLimpo) "E-mail inválido."

validarSenha :: Text -> Handler ()
validarSenha s = exigir (T.length s >= 6) "A senha precisa ter pelo menos 6 caracteres."

emailDisponivel :: Text -> Maybe UsuarioId -> Handler ()
emailDisponivel emailLimpo proprioId = do
    existente <- runDB $ getBy (UniqueEmail emailLimpo)
    case existente of
        Just (Entity outroId _) | Just outroId /= proprioId ->
            erroJson status409 "Já existe um usuário com este e-mail."
        _ -> return ()

criarHash :: Text -> Handler Text
criarHash s = do
    resultado <- liftIO (gerarHash s)
    maybe (erroJson status500 "Não foi possível proteger a senha.") return resultado
