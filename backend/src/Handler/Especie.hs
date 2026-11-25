{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE OverloadedRecordDot #-}
module Handler.Especie
    ( getEspeciesR
    , postEspeciesR
    , getEspecieR
    , putEspecieR
    , deleteEspecieR
    , especieJson
    ) where

import Control.Monad (when)
import Data.Text (Text)
import qualified Data.Text as T
import Database.Persist
import GHC.Generics (Generic)
import Network.HTTP.Types.Status
import Yesod.Core
import Yesod.Persist.Core (runDB)

import Foundation
import Handler.Comum
import Models

newtype DadosEspecie = DadosEspecie
    { nome :: Text
    } deriving Generic

instance FromJSON DadosEspecie

especieJson :: Entity Especie -> Value
especieJson (Entity especieId especie) = object
    [ "id"   .= especieId
    , "nome" .= especieNome especie
    ]

getEspeciesR :: Handler Value
getEspeciesR = do
    especies <- runDB $ selectList [] [Asc EspecieNome]
    return $ toJSON (map especieJson especies)

postEspeciesR :: Handler Value
postEspeciesR = do
    dados <- lerJson :: Handler DadosEspecie
    let nomeLimpo = T.strip dados.nome
    validarNome nomeLimpo
    nomeDisponivel nomeLimpo Nothing
    let especie = Especie { especieNome = nomeLimpo }
    especieId <- runDB $ insert especie
    sendStatusJSON status201 (especieJson (Entity especieId especie))

getEspecieR :: EspecieId -> Handler Value
getEspecieR especieId = do
    especie <- encontrarOu404 "Espécie não encontrada." especieId
    return $ especieJson (Entity especieId especie)

putEspecieR :: EspecieId -> Handler Value
putEspecieR especieId = do
    _ <- encontrarOu404 "Espécie não encontrada." especieId
    dados <- lerJson :: Handler DadosEspecie
    let nomeLimpo = T.strip dados.nome
    validarNome nomeLimpo
    nomeDisponivel nomeLimpo (Just especieId)
    let especie = Especie { especieNome = nomeLimpo }
    runDB $ replace especieId especie
    return $ especieJson (Entity especieId especie)

deleteEspecieR :: EspecieId -> Handler Value
deleteEspecieR especieId = do
    _ <- encontrarOu404 "Espécie não encontrada." especieId
    racas <- runDB $ count [RacaEspecieId ==. especieId]
    when (racas > 0) $
        erroJson status409 "Esta espécie tem raças cadastradas e não pode ser excluída."
    animais <- runDB $ count [AnimalEspecieId ==. especieId]
    when (animais > 0) $
        erroJson status409 "Esta espécie tem animais cadastrados e não pode ser excluída."
    runDB $ delete especieId
    responderSemConteudo

validarNome :: Text -> Handler ()
validarNome nomeLimpo = exigir (not (T.null nomeLimpo)) "Informe o nome da espécie."

-- Compara sem diferenciar maiúsculas para não aceitar "gato" se já existe "Gato".
nomeDisponivel :: Text -> Maybe EspecieId -> Handler ()
nomeDisponivel nomeLimpo proprioId = do
    especies <- runDB $ selectList [] []
    let repetida = [ outroId
                   | Entity outroId outra <- especies
                   , T.toLower (especieNome outra) == T.toLower nomeLimpo
                   , Just outroId /= proprioId
                   ]
    when (not (null repetida)) $
        erroJson status409 "Já existe uma espécie com este nome."
