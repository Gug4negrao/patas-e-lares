{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE OverloadedRecordDot #-}
module Handler.Animal
    ( getAnimaisR
    , postAnimaisR
    , getAnimalR
    , putAnimalR
    , deleteAnimalR
    , patchAnimalStatusR
    , animaisJson
    ) where

import Control.Monad (forM_, when)
import Data.List (nub)
import qualified Data.Map.Strict as Map
import Data.Maybe (fromMaybe, isJust, mapMaybe)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (Day, UTCTime, getCurrentTime, utctDay)
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

-- Corpo do POST e do PUT. No PUT a instituição não muda, então o campo é ignorado.
data DadosAnimal = DadosAnimal
    { instituicaoId   :: Maybe InstituicaoId
    , especieId       :: EspecieId
    , racaId          :: Maybe RacaId
    , nome            :: Text
    , sexo            :: Sexo
    , porte           :: Porte
    , nascimentoAprox :: Maybe Day
    , descricao       :: Text
    , fotoUrl         :: Maybe Text
    , castrado        :: Maybe Bool
    } deriving Generic

newtype NovoStatus = NovoStatus
    { status :: StatusAnimal
    } deriving Generic

instance FromJSON DadosAnimal
instance FromJSON NovoStatus

-- Listagem com filtros opcionais na query string:
-- especie, raca, instituicao (ids), sexo, porte, status, castrado (true/false),
-- cidade, uf (da instituição) e busca (trecho do nome).
getAnimaisR :: Handler Value
getAnimaisR = do
    fEspecie     <- paramChave "especie"
    fRaca        <- paramChave "raca"
    fInstituicao <- paramChave "instituicao"
    fSexo        <- paramValor "sexo"
    fPorte       <- paramValor "porte"
    fStatus      <- paramValor "status"
    fCastrado    <- paramCastrado
    fCidade      <- paramTexto "cidade"
    fUf          <- paramTexto "uf"
    fBusca       <- paramTexto "busca"

    filtroLocal <- case (fCidade, fUf) of
        (Nothing, Nothing) -> return []
        _ -> do
            instituicoes <- runDB $ selectList [] []
            let confere campo filtro = maybe True (igual campo) filtro
                ids = [ chave
                      | Entity chave inst <- instituicoes
                      , confere (instituicaoCidade inst) fCidade
                      , confere (instituicaoUf inst) fUf
                      ]
            return [AnimalInstituicaoId <-. ids]

    let filtros = concat
            [ [AnimalEspecieId ==. e        | Just e <- [fEspecie]]
            , [AnimalRacaId ==. Just r      | Just r <- [fRaca]]
            , [AnimalInstituicaoId ==. i    | Just i <- [fInstituicao]]
            , [AnimalSexo ==. s             | Just s <- [fSexo]]
            , [AnimalPorte ==. p            | Just p <- [fPorte]]
            , [AnimalStatus ==. s           | Just s <- [fStatus]]
            , [AnimalCastrado ==. c         | Just c <- [fCastrado]]
            , filtroLocal
            ]
    animais <- runDB $ selectList filtros [Desc AnimalCriadoEm]
    let encontrados = case fBusca of
            Nothing    -> animais
            Just busca -> filter (contem busca . animalNome . entityVal) animais
    toJSON <$> animaisJson encontrados

postAnimaisR :: Handler Value
postAnimaisR = do
    dados <- lerJson :: Handler DadosAnimal
    instituicaoId' <- maybe (erroJson status400 "Informe a instituição do animal.") return dados.instituicaoId
    inst <- runDB $ get instituicaoId'
    exigir (isJust inst) "Instituição não encontrada."
    agora <- liftIO getCurrentTime
    novo <- montarAnimal dados instituicaoId' Disponivel agora
    animalId <- runDB $ insert novo
    resposta <- umAnimalJson (Entity animalId novo)
    sendStatusJSON status201 resposta

getAnimalR :: AnimalId -> Handler Value
getAnimalR animalId = do
    animal <- encontrarOu404 "Animal não encontrado." animalId
    umAnimalJson (Entity animalId animal)

putAnimalR :: AnimalId -> Handler Value
putAnimalR animalId = do
    atual <- encontrarOu404 "Animal não encontrado." animalId
    dados <- lerJson :: Handler DadosAnimal
    animal <- montarAnimal dados (animalInstituicaoId atual) (animalStatus atual) (animalCriadoEm atual)
    runDB $ replace animalId animal
    umAnimalJson (Entity animalId animal)

-- O gestor só alterna entre Disponivel e Inativo. EmProcesso e Adotado
-- são definidos pelo fluxo de solicitação e adoção.
patchAnimalStatusR :: AnimalId -> Handler Value
patchAnimalStatusR animalId = do
    animal <- encontrarOu404 "Animal não encontrado." animalId
    dados <- lerJson :: Handler NovoStatus
    exigir (dados.status `elem` [Disponivel, Inativo])
        "Pelo cadastro do animal só é possível marcá-lo como Disponivel ou Inativo."
    when (animalStatus animal == Adotado) $
        erroJson status409 "Este animal já foi adotado e o status não pode mais ser alterado."
    when (animalStatus animal == EmProcesso) $
        erroJson status409 "Este animal está em processo de adoção. Responda a solicitação antes."
    runDB $ update animalId [AnimalStatus =. dados.status]
    umAnimalJson (Entity animalId animal { animalStatus = dados.status })

deleteAnimalR :: AnimalId -> Handler Value
deleteAnimalR animalId = do
    _ <- encontrarOu404 "Animal não encontrado." animalId
    adocao <- runDB $ getBy (UniqueAdocaoAnimal animalId)
    when (isJust adocao) $
        erroJson status409 "Este animal já foi adotado e não pode ser excluído. Marque-o como Inativo."
    solicitacoes <- runDB $ count [SolicitacaoAdocaoAnimalId ==. animalId]
    when (solicitacoes > 0) $
        erroJson status409 "Este animal tem solicitações de adoção e não pode ser excluído. Marque-o como Inativo."
    -- Registros de saúde e favoritos são apagados junto (ON DELETE CASCADE).
    runDB $ delete animalId
    responderSemConteudo

-- Valida o corpo e monta o animal. Instituição, status e data de criação vêm
-- de quem chama: no POST são novos, no PUT são mantidos os que já existiam.
montarAnimal :: DadosAnimal -> InstituicaoId -> StatusAnimal -> UTCTime -> Handler Animal
montarAnimal dados instituicaoId' statusAtual criadoEm = do
    hoje <- utctDay <$> liftIO getCurrentTime
    let nomeLimpo      = T.strip dados.nome
        descricaoLimpa = T.strip dados.descricao
    exigir (not (T.null nomeLimpo)) "Informe o nome do animal."
    exigir (T.length nomeLimpo <= 80) "O nome pode ter no máximo 80 caracteres."
    exigir (not (T.null descricaoLimpa)) "Escreva uma descrição do animal."
    forM_ dados.nascimentoAprox $ \nascimento ->
        exigir (nascimento <= hoje) "A data de nascimento não pode estar no futuro."
    especie <- runDB $ get dados.especieId
    exigir (isJust especie) "Espécie não encontrada."
    forM_ dados.racaId $ \racaId' -> do
        raca <- runDB $ get racaId'
        case raca of
            Nothing -> erroJson status400 "Raça não encontrada."
            Just r  -> exigir (racaEspecieId r == dados.especieId)
                           "A raça escolhida não pertence a esta espécie."
    let foto = textoOpcional dados.fotoUrl
    forM_ foto $ \url ->
        exigir ("http://" `T.isPrefixOf` url || "https://" `T.isPrefixOf` url)
            "A foto precisa ser um link começando com http:// ou https://."
    return Animal
        { animalInstituicaoId   = instituicaoId'
        , animalEspecieId       = dados.especieId
        , animalRacaId          = dados.racaId
        , animalNome            = nomeLimpo
        , animalSexo            = dados.sexo
        , animalPorte           = dados.porte
        , animalNascimentoAprox = dados.nascimentoAprox
        , animalDescricao       = descricaoLimpa
        , animalFotoUrl         = foto
        , animalCastrado        = fromMaybe False dados.castrado
        , animalStatus          = statusAtual
        , animalCriadoEm        = criadoEm
        }

umAnimalJson :: Entity Animal -> Handler Value
umAnimalJson animal = do
    lista <- animaisJson [animal]
    case lista of
        (valor : _) -> return valor
        []          -> erroJson status500 "Erro ao montar os dados do animal."

-- Converte animais em JSON já com o nome da espécie, da raça e da instituição,
-- buscando cada tabela uma vez só. Exportada para as telas de adoção e favoritos.
animaisJson :: [Entity Animal] -> Handler [Value]
animaisJson animais = do
    let valores = map entityVal animais
    especies <- runDB $ selectList [EspecieId <-. nub (map animalEspecieId valores)] []
    racas <- runDB $ selectList [RacaId <-. nub (mapMaybe animalRacaId valores)] []
    instituicoes <- runDB $ selectList [InstituicaoId <-. nub (map animalInstituicaoId valores)] []
    let mapaEspecies     = paraMapa especies
        mapaRacas        = paraMapa racas
        mapaInstituicoes = paraMapa instituicoes
    return $ map (animalJson mapaEspecies mapaRacas mapaInstituicoes) animais
  where
    paraMapa lista = Map.fromList [ (entityKey e, entityVal e) | e <- lista ]

animalJson
    :: Map.Map EspecieId Especie
    -> Map.Map RacaId Raca
    -> Map.Map InstituicaoId Instituicao
    -> Entity Animal
    -> Value
animalJson especies racas instituicoes (Entity animalId animal) = object
    [ "id"              .= animalId
    , "nome"            .= animalNome animal
    , "sexo"            .= animalSexo animal
    , "porte"           .= animalPorte animal
    , "nascimentoAprox" .= animalNascimentoAprox animal
    , "descricao"       .= animalDescricao animal
    , "fotoUrl"         .= animalFotoUrl animal
    , "castrado"        .= animalCastrado animal
    , "status"          .= animalStatus animal
    , "criadoEm"        .= animalCriadoEm animal
    , "especie"         .= especieObj
    , "raca"            .= racaObj
    , "instituicao"     .= instituicaoObj
    ]
  where
    especieId' = animalEspecieId animal
    especieObj = object
        [ "id"   .= especieId'
        , "nome" .= fmap especieNome (Map.lookup especieId' especies)
        ]
    racaObj = do
        racaId' <- animalRacaId animal
        raca <- Map.lookup racaId' racas
        return $ object
            [ "id"              .= racaId'
            , "nome"            .= racaNome raca
            , "temperamento"    .= racaTemperamento raca
            , "expectativaVida" .= racaExpectativaVida raca
            , "imagemUrl"       .= racaImagemUrl raca
            ]
    instituicaoId' = animalInstituicaoId animal
    instituicaoObj = case Map.lookup instituicaoId' instituicoes of
        Nothing   -> object [ "id" .= instituicaoId' ]
        Just inst -> object
            [ "id"     .= instituicaoId'
            , "nome"   .= instituicaoNome inst
            , "cidade" .= instituicaoCidade inst
            , "uf"     .= instituicaoUf inst
            ]

-- Leitura dos filtros da query string. Valor vazio conta como "sem filtro";
-- valor inválido responde 400.
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

paramCastrado :: Handler (Maybe Bool)
paramCastrado = do
    valor <- paramTexto "castrado"
    case T.toLower <$> valor of
        Nothing      -> return Nothing
        Just "true"  -> return (Just True)
        Just "false" -> return (Just False)
        Just _       -> paramInvalido "castrado"

paramInvalido :: Text -> Handler a
paramInvalido nomeParam = erroJson status400 ("Valor inválido no filtro '" <> nomeParam <> "'.")

igual :: Text -> Text -> Bool
igual a b = T.toCaseFold (T.strip a) == T.toCaseFold (T.strip b)

contem :: Text -> Text -> Bool
contem trecho texto = T.toCaseFold trecho `T.isInfixOf` T.toCaseFold texto
