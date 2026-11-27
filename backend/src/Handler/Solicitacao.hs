{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE OverloadedRecordDot #-}
module Handler.Solicitacao
    ( getSolicitacoesR
    , postSolicitacoesR
    , getSolicitacaoR
    , deleteSolicitacaoR
    ) where

import Control.Monad (unless, when)
import Data.List (nub)
import qualified Data.Map.Strict as Map
import Data.Maybe (isJust)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (getCurrentTime)
import Database.Persist
import GHC.Generics (Generic)
import Network.HTTP.Types.Status
import Yesod.Core
import Yesod.Persist.Core (YesodDB, runDB)

import Foundation
import Handler.Animal (animaisJson)
import Handler.Comum
import Handler.Filtros
import Models
import Tipos

data NovaSolicitacao = NovaSolicitacao
    { usuarioId        :: UsuarioId
    , animalId         :: AnimalId
    , mensagem         :: Text
    , tipoMoradia      :: TipoMoradia
    , temOutrosAnimais :: Bool
    } deriving Generic

instance FromJSON NovaSolicitacao

-- Dentro do runDB os erros precisam subir um nível (lift) para o Handler.
-- Como a exceção interrompe o bloco, a transação inteira é desfeita.
falhar :: Status -> Text -> YesodDB App a
falhar st msg = lift (erroJson st msg)

buscarSolicitacao :: SolicitacaoAdocaoId -> YesodDB App SolicitacaoAdocao
buscarSolicitacao sid =
    get sid >>= maybe (falhar status404 "Solicitação não encontrada.") return

buscarPendente :: Text -> SolicitacaoAdocaoId -> YesodDB App SolicitacaoAdocao
buscarPendente mensagemConflito sid = do
    s <- buscarSolicitacao sid
    when (solicitacaoAdocaoStatus s /= Pendente) $ falhar status409 mensagemConflito
    return s

-- Se a última pendente saiu (cancelada ou rejeitada), o animal volta a ficar Disponivel.
liberarAnimalSeSemPendentes :: AnimalId -> YesodDB App ()
liberarAnimalSeSemPendentes aid = do
    restantes <- count [ SolicitacaoAdocaoAnimalId ==. aid
                       , SolicitacaoAdocaoStatus ==. Pendente ]
    when (restantes == 0) $
        updateWhere [AnimalId ==. aid, AnimalStatus ==. EmProcesso]
                    [AnimalStatus =. Disponivel]

-- GET /api/solicitacoes
-- Filtros opcionais: usuario, animal, instituicao (ids) e status.
getSolicitacoesR :: Handler Value
getSolicitacoesR = do
    fUsuario     <- paramChave "usuario"
    fAnimal      <- paramChave "animal"
    fInstituicao <- paramChave "instituicao"
    fStatus      <- paramValor "status"

    filtroInstituicao <- case fInstituicao of
        Nothing -> return []
        Just i -> do
            animais <- runDB $ selectList [AnimalInstituicaoId ==. i] []
            return [SolicitacaoAdocaoAnimalId <-. map entityKey animais]

    let filtros = concat
            [ [SolicitacaoAdocaoUsuarioId ==. u | Just u <- [fUsuario]]
            , [SolicitacaoAdocaoAnimalId ==. a  | Just a <- [fAnimal]]
            , [SolicitacaoAdocaoStatus ==. s    | Just s <- [fStatus]]
            , filtroInstituicao
            ]
    solicitacoes <- runDB $ selectList filtros [Desc SolicitacaoAdocaoCriadoEm]
    toJSON <$> solicitacoesJson solicitacoes

-- POST /api/solicitacoes
postSolicitacoesR :: Handler Value
postSolicitacoesR = do
    dados <- lerJson :: Handler NovaSolicitacao
    let texto = T.strip dados.mensagem
    exigir (not (T.null texto)) "Escreva uma mensagem para a instituição."
    agora <- liftIO getCurrentTime
    nova <- runDB $ do
        usuario <- get dados.usuarioId
            >>= maybe (falhar status404 "Usuário não encontrado.") return
        unless (usuarioTipo usuario == Adotante) $
            falhar status403 "Só adotantes podem solicitar adoção."
        animal <- get dados.animalId
            >>= maybe (falhar status404 "Animal não encontrado.") return
        -- EmProcesso também recebe pedidos, senão nunca haveria "outras pendentes" para rejeitar.
        unless (animalStatus animal `elem` [Disponivel, EmProcesso]) $
            falhar status409 "Este animal não está disponível para adoção."
        repetida <- selectFirst
            [ SolicitacaoAdocaoUsuarioId ==. dados.usuarioId
            , SolicitacaoAdocaoAnimalId ==. dados.animalId
            , SolicitacaoAdocaoStatus ==. Pendente
            ] []
        when (isJust repetida) $
            falhar status409 "Você já tem uma solicitação pendente para este animal."
        let solicitacao = SolicitacaoAdocao
                { solicitacaoAdocaoUsuarioId        = dados.usuarioId
                , solicitacaoAdocaoAnimalId         = dados.animalId
                , solicitacaoAdocaoMensagem         = texto
                , solicitacaoAdocaoTipoMoradia      = dados.tipoMoradia
                , solicitacaoAdocaoTemOutrosAnimais = dados.temOutrosAnimais
                , solicitacaoAdocaoStatus           = Pendente
                , solicitacaoAdocaoMotivoResposta   = Nothing
                , solicitacaoAdocaoCriadoEm         = agora
                , solicitacaoAdocaoRespondidoEm     = Nothing
                }
        sid <- insert solicitacao
        -- A primeira solicitação recebida muda o animal para EmProcesso.
        when (animalStatus animal == Disponivel) $
            update dados.animalId [AnimalStatus =. EmProcesso]
        return (Entity sid solicitacao)
    resposta <- umaSolicitacaoJson nova
    sendStatusJSON status201 resposta

-- GET /api/solicitacoes/#id
getSolicitacaoR :: SolicitacaoAdocaoId -> Handler Value
getSolicitacaoR sid = do
    solicitacao <- encontrarOu404 "Solicitação não encontrada." sid
    umaSolicitacaoJson (Entity sid solicitacao)

-- DELETE /api/solicitacoes/#id
-- Cancela a solicitação (o registro fica no histórico). Só vale se estiver Pendente.
deleteSolicitacaoR :: SolicitacaoAdocaoId -> Handler Value
deleteSolicitacaoR sid = do
    agora <- liftIO getCurrentTime
    cancelada <- runDB $ do
        s <- buscarPendente "Só é possível cancelar solicitações pendentes." sid
        update sid [ SolicitacaoAdocaoStatus =. Cancelada
                   , SolicitacaoAdocaoRespondidoEm =. Just agora ]
        liberarAnimalSeSemPendentes (solicitacaoAdocaoAnimalId s)
        return s { solicitacaoAdocaoStatus = Cancelada
                 , solicitacaoAdocaoRespondidoEm = Just agora }
    umaSolicitacaoJson (Entity sid cancelada)

-- JSON

umaSolicitacaoJson :: Entity SolicitacaoAdocao -> Handler Value
umaSolicitacaoJson solicitacao = do
    lista <- solicitacoesJson [solicitacao]
    case lista of
        (valor : _) -> return valor
        []          -> erroJson status500 "Erro ao montar os dados da solicitação."

-- Já traz o animal (no mesmo formato de animaisJson) e os dados do adotante.
solicitacoesJson :: [Entity SolicitacaoAdocao] -> Handler [Value]
solicitacoesJson solicitacoes = do
    let valores = map entityVal solicitacoes
    animais <- runDB $
        selectList [AnimalId <-. nub (map solicitacaoAdocaoAnimalId valores)] []
    usuarios <- runDB $
        selectList [UsuarioId <-. nub (map solicitacaoAdocaoUsuarioId valores)] []
    animaisValores <- animaisJson animais
    let mapaAnimais  = Map.fromList (zip (map entityKey animais) animaisValores)
        mapaUsuarios = Map.fromList [ (entityKey u, entityVal u) | u <- usuarios ]
    return $ map (solicitacaoJson mapaAnimais mapaUsuarios) solicitacoes

solicitacaoJson
    :: Map.Map AnimalId Value
    -> Map.Map UsuarioId Usuario
    -> Entity SolicitacaoAdocao
    -> Value
solicitacaoJson animais usuarios (Entity sid s) = object
    [ "id"               .= sid
    , "mensagem"         .= solicitacaoAdocaoMensagem s
    , "tipoMoradia"      .= solicitacaoAdocaoTipoMoradia s
    , "temOutrosAnimais" .= solicitacaoAdocaoTemOutrosAnimais s
    , "status"           .= solicitacaoAdocaoStatus s
    , "motivoResposta"   .= solicitacaoAdocaoMotivoResposta s
    , "criadoEm"         .= solicitacaoAdocaoCriadoEm s
    , "respondidoEm"     .= solicitacaoAdocaoRespondidoEm s
    , "animal"           .= Map.lookup (solicitacaoAdocaoAnimalId s) animais
    , "usuario"          .= (usuarioJson uid <$> Map.lookup uid usuarios)
    ]
  where
    uid = solicitacaoAdocaoUsuarioId s

-- Sem a senha.
usuarioJson :: UsuarioId -> Usuario -> Value
usuarioJson uid u = object
    [ "id"       .= uid
    , "nome"     .= usuarioNome u
    , "email"    .= usuarioEmail u
    , "telefone" .= usuarioTelefone u
    ]
