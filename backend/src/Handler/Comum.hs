module Handler.Comum
    ( lerJson
    , exigir
    , encontrarOu404
    , responderSemConteudo
    , emailValido
    , normalizarEmail
    , textoOpcional
    ) where

import Control.Monad (unless)
import Data.Aeson (Result (..))
import Data.Text (Text)
import qualified Data.Text as T
import Database.Persist.Sql (Key, PersistRecordBackend, SqlBackend, get)
import Network.HTTP.Types.Status
import Yesod.Core
import Yesod.Persist.Core (runDB)

import Foundation

lerJson :: FromJSON a => Handler a
lerJson = do
    resultado <- parseCheckJsonBody
    case resultado of
        Success valor -> return valor
        Error motivo
            | "ParseError" `T.isPrefixOf` T.pack motivo ->
                erroJson status400 "O corpo da requisição não é um JSON válido."
            | otherwise ->
                erroJson status400 ("JSON inválido: " <> T.pack motivo)

exigir :: Bool -> Text -> Handler ()
exigir condicao mensagem = unless condicao (erroJson status400 mensagem)

encontrarOu404 :: PersistRecordBackend registro SqlBackend => Text -> Key registro -> Handler registro
encontrarOu404 mensagem chave = do
    registro <- runDB (get chave)
    maybe (erroJson status404 mensagem) return registro

responderSemConteudo :: Handler a
responderSemConteudo = sendResponseStatus status204 ()

emailValido :: Text -> Bool
emailValido email = case T.splitOn "@" email of
    [nome, dominio] ->
        not (T.null nome)
            && T.isInfixOf "." dominio
            && not (T.isPrefixOf "." dominio)
            && not (T.isSuffixOf "." dominio)
            && not (T.any (== ' ') email)
    _ -> False

normalizarEmail :: Text -> Text
normalizarEmail = T.toLower . T.strip

textoOpcional :: Maybe Text -> Maybe Text
textoOpcional valor = case T.strip <$> valor of
    Just t | not (T.null t) -> Just t
    _                       -> Nothing
