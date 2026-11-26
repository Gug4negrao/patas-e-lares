{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE OverloadedRecordDot #-}
module Handler.Instituicao
    ( getInstituicoesR
    , postInstituicoesR
    , getInstituicaoR
    , putInstituicaoR
    , deleteInstituicaoR
    , instituicaoJson
    ) where

import Control.Monad (when)
import Data.Text (Text)
import qualified Data.Text as T
import GHC.Generics (Generic)
import Database.Persist
import Network.HTTP.Types.Status
import Yesod.Core
import Yesod.Persist.Core (runDB)

import Foundation
import Handler.Comum
import Models
import Tipos

data DadosInstituicao = DadosInstituicao
    { usuarioId :: UsuarioId
    , nome :: Text
    , cnpj :: Maybe Text
    , telefone :: Text
    , email :: Text
    , cep :: Text
    , logradouro :: Text
    , numero :: Text
    , complemento :: Maybe Text
    , bairro :: Text
    , cidade :: Text
    , uf :: Text
    } deriving Generic

instance FromJSON DadosInstituicao

instituicaoJson :: Entity Instituicao -> Value
instituicaoJson (Entity instituicaoId instituicao) = object
    [ "id"          .= instituicaoId
    , "usuarioId"   .= instituicaoUsuarioId instituicao
    , "nome"         .= instituicaoNome instituicao
    , "cnpj"         .= instituicaoCnpj instituicao
    , "telefone"     .= instituicaoTelefone instituicao
    , "email"        .= instituicaoEmail instituicao
    , "cep"          .= instituicaoCep instituicao
    , "logradouro"   .= instituicaoLogradouro instituicao
    , "numero"       .= instituicaoNumero instituicao
    , "complemento"  .= instituicaoComplemento instituicao
    , "bairro"        .= instituicaoBairro instituicao
    , "cidade"        .= instituicaoCidade instituicao
    , "uf"            .= instituicaoUf instituicao
    ]

getInstituicoesR :: Handler Value
getInstituicoesR = do
    instituicoes <- runDB $ selectList [] [Asc InstituicaoNome]
    return $ toJSON (map instituicaoJson instituicoes)

getInstituicaoR :: InstituicaoId -> Handler Value
getInstituicaoR instituicaoId = do
    instituicao <- encontrarOu404 "Instituição não encontrada." instituicaoId
    return $ instituicaoJson (Entity instituicaoId instituicao)

validarInstituicao :: DadosInstituicao -> Text -> Text -> Text -> Text -> Handler ()
validarInstituicao dados nomeLimpo emailLimpo cepLimpo ufLimpa = do
    exigir (not (T.null nomeLimpo)) "Informe o nome da instituição."
    exigir (emailValido emailLimpo) "Informe um e-mail válido."
    exigir (not (T.null (T.strip dados.telefone))) "Informe o telefone."
    exigir (T.length cepLimpo == 8 && T.all (\c -> c >= '0' && c <= '9') cepLimpo)
        "O CEP deve conter 8 dígitos numéricos."
    exigir (not (T.null (T.strip dados.logradouro))) "Informe o logradouro."
    exigir (not (T.null (T.strip dados.numero))) "Informe o número."
    exigir (not (T.null (T.strip dados.bairro))) "Informe o bairro."
    exigir (not (T.null (T.strip dados.cidade))) "Informe a cidade."
    exigir (T.length ufLimpa == 2 && T.all (\c -> c >= 'A' && c <= 'Z') ufLimpa)
        "Informe uma UF válida com 2 letras."

postInstituicoesR :: Handler Value
postInstituicoesR = do
    dados <- lerJson :: Handler DadosInstituicao

    let nomeLimpo  = T.strip dados.nome
        emailLimpo = T.toLower (T.strip dados.email)
        cepLimpo   = T.filter (/= '-') (T.strip dados.cep)
        ufLimpa    = T.toUpper (T.strip dados.uf)

    validarInstituicao dados nomeLimpo emailLimpo cepLimpo ufLimpa

    usuario <- encontrarOu404 "Gestor não encontrado." dados.usuarioId

    exigir (usuarioTipo usuario == Gestor) "A instituição deve estar associada a um usuário do tipo Gestor."

    existente <- runDB $ getBy (UniqueInstituicaoUsuario dados.usuarioId)

    when (maybe False (const True) existente) (erroJson status409 "Este gestor já possui uma instituição cadastrada.")

    let instituicao = Instituicao
            { instituicaoUsuarioId  = dados.usuarioId
            , instituicaoNome       = nomeLimpo
            , instituicaoCnpj       = textoOpcional dados.cnpj
            , instituicaoTelefone   = T.strip dados.telefone
            , instituicaoEmail      = emailLimpo
            , instituicaoCep        = cepLimpo
            , instituicaoLogradouro = T.strip dados.logradouro
            , instituicaoNumero     = T.strip dados.numero
            , instituicaoComplemento = textoOpcional dados.complemento
            , instituicaoBairro    = T.strip dados.bairro
            , instituicaoCidade    = T.strip dados.cidade
            , instituicaoUf        = ufLimpa
            }

    instituicaoId <- runDB $ insert instituicao

    sendStatusJSON status201 (instituicaoJson (Entity instituicaoId instituicao))

putInstituicaoR :: InstituicaoId -> Handler Value
putInstituicaoR instituicaoId = do
    atual <- encontrarOu404 "Instituição não encontrada." instituicaoId
    dados <- lerJson :: Handler DadosInstituicao

    let nomeLimpo  = T.strip dados.nome
        emailLimpo = T.toLower (T.strip dados.email)
        cepLimpo   = T.filter (/= '-') (T.strip dados.cep)
        ufLimpa    = T.toUpper (T.strip dados.uf)

    validarInstituicao dados nomeLimpo emailLimpo cepLimpo ufLimpa

    usuario <- encontrarOu404 "Gestor não encontrado." dados.usuarioId

    exigir (usuarioTipo usuario == Gestor) "A instituição deve estar associada a um usuário do tipo Gestor."

    existente <- runDB $ getBy (UniqueInstituicaoUsuario dados.usuarioId)

    when (maybe False (const True) existente && instituicaoUsuarioId atual /= dados.usuarioId)
        (erroJson status409 "Este gestor já possui uma instituição cadastrada.")

    let instituicao = atual
            { instituicaoUsuarioId   = dados.usuarioId
            , instituicaoNome        = nomeLimpo
            , instituicaoCnpj        = textoOpcional dados.cnpj
            , instituicaoTelefone    = T.strip dados.telefone
            , instituicaoEmail       = emailLimpo
            , instituicaoCep         = cepLimpo
            , instituicaoLogradouro  = T.strip dados.logradouro
            , instituicaoNumero      = T.strip dados.numero
            , instituicaoComplemento = textoOpcional dados.complemento
            , instituicaoBairro      = T.strip dados.bairro
            , instituicaoCidade      = T.strip dados.cidade
            , instituicaoUf          = ufLimpa
            }

    runDB $ replace instituicaoId instituicao

    return $ instituicaoJson (Entity instituicaoId instituicao)

deleteInstituicaoR :: InstituicaoId -> Handler ()
deleteInstituicaoR instituicaoId = do
    _ <- encontrarOu404 "Instituição não encontrada." instituicaoId

    animais <- runDB $ selectList [AnimalInstituicaoId ==. instituicaoId] []

    when (not (null animais))
        (erroJson status409 "Não é possível excluir uma instituição que possui animais cadastrados.")

    runDB $ delete instituicaoId

    sendResponseStatus status204 ()