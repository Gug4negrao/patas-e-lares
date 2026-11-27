module Handler.Filtros
    ( paramChave
    , paramValor
    ) where

import Data.Text (Text)
import qualified Data.Text as T
import Network.HTTP.Types.Status
import Text.Read (readMaybe)
import Yesod.Core

import Foundation
import Handler.Comum

paramTexto :: Text -> Handler (Maybe Text)
paramTexto nomeParam = textoOpcional <$> lookupGetParam nomeParam

paramChave :: PathPiece chave => Text -> Handler (Maybe chave)
paramChave nomeParam = do
    valor <- paramTexto nomeParam
    case valor of
        Nothing -> return Nothing
        Just t  -> maybe (paramInvalido nomeParam) (return . Just) (fromPathPiece t)

paramValor :: Read valor => Text -> Handler (Maybe valor)
paramValor nomeParam = do
    valor <- paramTexto nomeParam
    case valor of
        Nothing -> return Nothing
        Just t  -> maybe (paramInvalido nomeParam) (return . Just) (readMaybe (T.unpack t))

paramInvalido :: Text -> Handler a
paramInvalido nomeParam = erroJson status400 ("Valor inválido no filtro '" <> nomeParam <> "'.")
