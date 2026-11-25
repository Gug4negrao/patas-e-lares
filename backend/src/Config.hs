module Config
    ( Config (..)
    , carregarConfig
    ) where

import Data.ByteString (ByteString)
import Data.Maybe (fromMaybe)
import Data.Text (Text)
import qualified Data.Text as T
import qualified Data.Text.Encoding as TE
import System.Environment (lookupEnv)
import Text.Read (readMaybe)

data Config = Config
    { cfgPorta          :: Int
    , cfgBanco          :: ByteString
    , cfgTamanhoPool    :: Int
    , cfgOrigemFrontend :: Text
    }

carregarConfig :: IO Config
carregarConfig = do
    porta  <- lerNumero "PORT" 8080
    banco  <- lerTexto "DATABASE_URL"
                  "host=localhost port=5432 user=patas password=patas dbname=patas_e_lares"
    pool   <- lerNumero "DB_POOL" 10
    origem <- lerTexto "FRONTEND_ORIGIN" "http://localhost:5173"
    return Config
        { cfgPorta          = porta
        , cfgBanco          = TE.encodeUtf8 banco
        , cfgTamanhoPool    = pool
        , cfgOrigemFrontend = origem
        }

lerTexto :: String -> Text -> IO Text
lerTexto nome padrao = do
    valor <- lookupEnv nome
    return $ case valor of
        Just v | not (null v) -> T.pack v
        _                     -> padrao

lerNumero :: String -> Int -> IO Int
lerNumero nome padrao = do
    valor <- lookupEnv nome
    return $ fromMaybe padrao (valor >>= readMaybe)
