module Handler.Adocao
    ( adocaoJson
    ) where

import Database.Persist
import Yesod.Core

import Models

-- Neste commit o módulo só expõe o JSON da adoção, usado ao aprovar uma solicitação.
-- O commit 3 substitui este arquivo pela versão completa (consulta, listagem e atualização).
adocaoJson :: Entity Adocao -> Value
adocaoJson (Entity aid a) = object
    [ "id"               .= aid
    , "solicitacaoId"    .= adocaoSolicitacaoId a
    , "animalId"         .= adocaoAnimalId a
    , "dataAdocao"       .= adocaoDataAdocao a
    , "termoAceito"      .= adocaoTermoAceito a
    , "observacoes"      .= adocaoObservacoes a
    , "retornoPosAdocao" .= adocaoRetornoPosAdocao a
    ]
