module Handler.Raca
    ( getRacasR
    , getRacaR
    , postRacasSincronizarR
    , racaJson
    ) where

import Data.Text (Text)
import qualified Data.Text as T
import Database.Persist
import Network.HTTP.Types.Status
import Yesod.Core
import Yesod.Persist.Core (runDB)

import Config (Config (..))
import DogApi
import Foundation
import Handler.Comum
import Models

racaJson :: Entity Raca -> Value
racaJson (Entity racaId raca) = object
    [ "id"              .= racaId
    , "especieId"       .= racaEspecieId raca
    , "nome"            .= racaNome raca
    , "dogApiId"        .= racaDogApiId raca
    , "temperamento"    .= racaTemperamento raca
    , "expectativaVida" .= racaExpectativaVida raca
    , "imagemUrl"       .= racaImagemUrl raca
    ]

-- | Lista as raças em ordem alfabética, lendo do banco (não da TheDogAPI).
-- Filtros opcionais: especie (id) e busca (trecho do nome).
getRacasR :: Handler Value
getRacasR = do
    fEspecie <- paramChave "especie"
    fBusca   <- textoOpcional <$> lookupGetParam "busca"
    racas    <- runDB $ selectList [RacaEspecieId ==. e | Just e <- [fEspecie]] [Asc RacaNome]
    let encontradas = case fBusca of
            Nothing    -> racas
            Just busca -> filter (contem busca . racaNome . entityVal) racas
    return $ toJSON (map racaJson encontradas)

getRacaR :: RacaId -> Handler Value
getRacaR racaId = do
    raca <- encontrarOu404 "Raça não encontrada." racaId
    return $ racaJson (Entity racaId raca)

-- | Importa (ou atualiza) as raças de cães a partir da TheDogAPI.
-- A chave fica no servidor; o frontend só chama esta rota.
postRacasSincronizarR :: Handler Value
postRacasSincronizarR = do
    chave    <- getsYesod (cfgChaveDogApi . appConfig)
    resposta <- liftIO (buscarRacasDogApi chave)
    racas    <- either falhar return resposta
    salvas   <- runDB (salvarRacas racas) >>= either falhar return
    return $ object
        [ "mensagem" .= ("Raças importadas da TheDogAPI." :: Text)
        , "racas"    .= salvas
        ]
  where
    falhar erro = erroJson (statusDoErro erro) (mensagemErro erro)

-- | 503: o servidor não está configurado para a integração;
-- 502: a TheDogAPI falhou ou respondeu algo inesperado.
statusDoErro :: ErroDogApi -> Status
statusDoErro erro = case erro of
    ChaveAusente      -> status503
    EspecieCaoAusente -> status409
    _                 -> status502

paramChave :: PathPiece chave => Text -> Handler (Maybe chave)
paramChave nomeParam = do
    valor <- textoOpcional <$> lookupGetParam nomeParam
    case valor of
        Nothing -> return Nothing
        Just t  -> maybe invalido (return . Just) (fromPathPiece t)
  where
    invalido = erroJson status400 ("Valor inválido no filtro '" <> nomeParam <> "'.")

contem :: Text -> Text -> Bool
contem trecho texto = T.toCaseFold trecho `T.isInfixOf` T.toCaseFold texto
