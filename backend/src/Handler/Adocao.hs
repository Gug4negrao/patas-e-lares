{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE OverloadedRecordDot #-}
module Handler.Adocao
    ( getAdocoesR
    , getAdocaoR
    , putAdocaoR
    , adocaoJson
    ) where

import Data.Maybe (catMaybes, isJust)
import Data.Text (Text)
import Database.Persist
import GHC.Generics (Generic)
import Yesod.Core
import Yesod.Persist.Core (runDB)

import Foundation
import Handler.Comum
import Handler.Filtros
import Models
import Tipos

-- Só estes dois campos podem ser alterados depois da adoção.
data DadosAdocao = DadosAdocao
    { observacoes      :: Maybe Text
    , retornoPosAdocao :: Maybe Text
    } deriving Generic

instance FromJSON DadosAdocao

-- GET /api/adocoes
-- Filtros opcionais: usuario (adotante), animal e instituicao (ids).
getAdocoesR :: Handler Value
getAdocoesR = do
    fUsuario     <- paramChave "usuario"
    fAnimal      <- paramChave "animal"
    fInstituicao <- paramChave "instituicao"

    filtroUsuario <- case fUsuario of
        Nothing -> return []
        Just u -> do
            solicitacoes <- runDB $ selectList
                [ SolicitacaoAdocaoUsuarioId ==. u
                , SolicitacaoAdocaoStatus ==. Aprovada ] []
            return [AdocaoSolicitacaoId <-. map entityKey solicitacoes]

    filtroInstituicao <- case fInstituicao of
        Nothing -> return []
        Just i -> do
            animais <- runDB $ selectList [AnimalInstituicaoId ==. i] []
            return [AdocaoAnimalId <-. map entityKey animais]

    let filtros = concat
            [ [AdocaoAnimalId ==. a | Just a <- [fAnimal]]
            , filtroUsuario
            , filtroInstituicao
            ]
    adocoes <- runDB $ selectList filtros [Desc AdocaoDataAdocao]
    return (toJSON (map adocaoJson adocoes))

-- GET /api/adocoes/#id
getAdocaoR :: AdocaoId -> Handler Value
getAdocaoR aid = do
    adocao <- encontrarOu404 "Adoção não encontrada." aid
    return (adocaoJson (Entity aid adocao))

-- PUT /api/adocoes/#id     corpo: { "observacoes": "...", "retornoPosAdocao": "..." }
putAdocaoR :: AdocaoId -> Handler Value
putAdocaoR aid = do
    _ <- encontrarOu404 "Adoção não encontrada." aid
    dados <- lerJson :: Handler DadosAdocao
    let obs = textoOpcional dados.observacoes
        ret = textoOpcional dados.retornoPosAdocao
    exigir (isJust obs || isJust ret) "Envie observacoes e/ou retornoPosAdocao."
    runDB $ update aid $ catMaybes
        [ (AdocaoObservacoes =.) . Just <$> obs
        , (AdocaoRetornoPosAdocao =.) . Just <$> ret
        ]
    atualizada <- encontrarOu404 "Adoção não encontrada." aid
    return (adocaoJson (Entity aid atualizada))

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
