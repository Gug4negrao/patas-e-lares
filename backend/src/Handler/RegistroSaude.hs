{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE OverloadedRecordDot #-}
module Handler.RegistroSaude
    ( getRegistrosSaudeR
    , postRegistrosSaudeR
    , getRegistroSaudeR
    , putRegistroSaudeR
    , deleteRegistroSaudeR
    ) where

import Control.Monad (when)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (Day, getCurrentTime, utctDay)
import Database.Persist
import GHC.Generics (Generic)
import Network.HTTP.Types.Status
import Text.Read (readMaybe)
import Yesod.Core
import Yesod.Persist.Core (runDB)

import Foundation
import Handler.Comum
import Models
import Tipos

data DadosRegistro = DadosRegistro
    { tipo        :: TipoRegistro
    , descricao   :: Text
    , realizadoEm :: Day
    , veterinario :: Maybe Text
    } deriving Generic

instance FromJSON DadosRegistro

registroJson :: Entity RegistroSaude -> Value
registroJson (Entity registroId registro) = object
    [ "id"          .= registroId
    , "animalId"    .= registroSaudeAnimalId registro
    , "tipo"        .= registroSaudeTipo registro
    , "descricao"   .= registroSaudeDescricao registro
    , "realizadoEm" .= registroSaudeRealizadoEm registro
    , "veterinario" .= registroSaudeVeterinario registro
    ]

-- Histórico de saúde do animal, do mais recente para o mais antigo.
-- Aceita ?tipo=Vacina (ou Vermifugo, Consulta, Castracao) para filtrar.
getRegistrosSaudeR :: AnimalId -> Handler Value
getRegistrosSaudeR animalId = do
    _ <- encontrarOu404 "Animal não encontrado." animalId
    tipoParam <- textoOpcional <$> lookupGetParam "tipo"
    filtroTipo <- case tipoParam of
        Nothing -> return []
        Just t  -> case readMaybe (T.unpack t) of
            Just tipo' -> return [RegistroSaudeTipo ==. tipo']
            Nothing    -> erroJson status400 "Valor inválido no filtro 'tipo'."
    registros <- runDB $ selectList
        ((RegistroSaudeAnimalId ==. animalId) : filtroTipo)
        [Desc RegistroSaudeRealizadoEm, Desc RegistroSaudeId]
    return $ toJSON (map registroJson registros)

postRegistrosSaudeR :: AnimalId -> Handler Value
postRegistrosSaudeR animalId = do
    _ <- encontrarOu404 "Animal não encontrado." animalId
    dados <- lerJson :: Handler DadosRegistro
    registro <- montarRegistro animalId dados
    registroId <- runDB $ insert registro
    marcarCastrado registro
    sendStatusJSON status201 (registroJson (Entity registroId registro))

getRegistroSaudeR :: RegistroSaudeId -> Handler Value
getRegistroSaudeR registroId = do
    registro <- encontrarOu404 "Registro de saúde não encontrado." registroId
    return $ registroJson (Entity registroId registro)

putRegistroSaudeR :: RegistroSaudeId -> Handler Value
putRegistroSaudeR registroId = do
    atual <- encontrarOu404 "Registro de saúde não encontrado." registroId
    dados <- lerJson :: Handler DadosRegistro
    registro <- montarRegistro (registroSaudeAnimalId atual) dados
    runDB $ replace registroId registro
    marcarCastrado registro
    return $ registroJson (Entity registroId registro)

deleteRegistroSaudeR :: RegistroSaudeId -> Handler Value
deleteRegistroSaudeR registroId = do
    _ <- encontrarOu404 "Registro de saúde não encontrado." registroId
    runDB $ delete registroId
    responderSemConteudo

montarRegistro :: AnimalId -> DadosRegistro -> Handler RegistroSaude
montarRegistro animalId dados = do
    hoje <- utctDay <$> liftIO getCurrentTime
    let descricaoLimpa = T.strip dados.descricao
    exigir (not (T.null descricaoLimpa)) "Descreva o procedimento (ex.: nome da vacina)."
    exigir (dados.realizadoEm <= hoje) "A data do procedimento não pode estar no futuro."
    return RegistroSaude
        { registroSaudeAnimalId    = animalId
        , registroSaudeTipo        = dados.tipo
        , registroSaudeDescricao   = descricaoLimpa
        , registroSaudeRealizadoEm = dados.realizadoEm
        , registroSaudeVeterinario = textoOpcional dados.veterinario
        }

-- Registrar uma castração já marca o animal como castrado.
marcarCastrado :: RegistroSaude -> Handler ()
marcarCastrado registro =
    when (registroSaudeTipo registro == Castracao) $
        runDB $ update (registroSaudeAnimalId registro) [AnimalCastrado =. True]
