module Senha
    ( gerarHash
    , senhaConfere
    ) where

import Crypto.BCrypt
import Data.Text (Text)
import qualified Data.Text.Encoding as TE

politica :: HashingPolicy
politica = fastBcryptHashingPolicy { preferredHashCost = 10 }

gerarHash :: Text -> IO (Maybe Text)
gerarHash senha = do
    resultado <- hashPasswordUsingPolicy politica (TE.encodeUtf8 senha)
    return (TE.decodeUtf8 <$> resultado)

senhaConfere :: Text -> Text -> Bool
senhaConfere senha hash = validatePassword (TE.encodeUtf8 hash) (TE.encodeUtf8 senha)
