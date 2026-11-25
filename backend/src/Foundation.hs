module Foundation where

import Data.Text (Text)
import qualified Data.Text as T
import Database.Persist.Sql (ConnectionPool, SqlBackend, runSqlPool)
import Network.HTTP.Types.Status
import Yesod.Core
import Yesod.Persist.Core

import Config (Config)

data App = App
    { appPool   :: ConnectionPool
    , appConfig :: Config
    }

mkYesodData "App" $(parseRoutesFile "config/routes.yesodroutes")

instance Yesod App where
    makeSessionBackend _ = return Nothing
    errorHandler = responderErro

instance YesodPersist App where
    type YesodPersistBackend App = SqlBackend
    runDB acao = do
        pool <- getsYesod appPool
        runSqlPool acao pool

responderErro :: ErrorResponse -> HandlerFor App TypedContent
responderErro erro = case erro of
    NotFound              -> erroJson status404 "Recurso não encontrado."
    InvalidArgs motivos   -> erroJson status400 (T.intercalate "; " motivos)
    BadMethod _           -> erroJson status405 "Método HTTP não permitido nesta rota."
    NotAuthenticated      -> erroJson status401 "É preciso estar logado."
    PermissionDenied msg  -> erroJson status403 msg
    InternalError msg     -> do
        $logError ("Erro interno: " <> msg)
        erroJson status500 "Erro interno no servidor."

erroJson :: MonadHandler m => Status -> Text -> m a
erroJson status mensagem = sendStatusJSON status (object ["erro" .= mensagem])
