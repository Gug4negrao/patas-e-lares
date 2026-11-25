{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DerivingStrategies #-}
{-# LANGUAGE GADTs #-}
{-# LANGUAGE UndecidableInstances #-}
module Models where

import Data.Text (Text)
import Data.Time (Day, UTCTime)
import Database.Persist.TH

import Tipos

share [mkPersist sqlSettings, mkMigrate "migrateAll"] [persistLowerCase|
Usuario
    nome Text
    email Text
    senhaHash Text
    telefone Text Maybe
    tipo TipoUsuario
    criadoEm UTCTime
    UniqueEmail email
    deriving Show

Instituicao json
    usuarioId UsuarioId
    nome Text
    cnpj Text Maybe
    telefone Text
    email Text
    cep Text
    logradouro Text
    numero Text
    complemento Text Maybe
    bairro Text
    cidade Text
    uf Text
    UniqueInstituicaoUsuario usuarioId
    deriving Show

Especie json
    nome Text
    UniqueEspecieNome nome
    deriving Show

Raca json
    especieId EspecieId
    nome Text
    dogApiId Int Maybe
    temperamento Text Maybe
    expectativaVida Text Maybe
    imagemUrl Text Maybe
    UniqueRaca especieId nome
    deriving Show

Animal json
    instituicaoId InstituicaoId
    especieId EspecieId
    racaId RacaId Maybe
    nome Text
    sexo Sexo
    porte Porte
    nascimentoAprox Day Maybe
    descricao Text
    fotoUrl Text Maybe
    castrado Bool
    status StatusAnimal
    criadoEm UTCTime
    deriving Show

RegistroSaude json
    animalId AnimalId OnDeleteCascade
    tipo TipoRegistro
    descricao Text
    realizadoEm Day
    veterinario Text Maybe
    deriving Show

SolicitacaoAdocao json
    usuarioId UsuarioId
    animalId AnimalId
    mensagem Text
    tipoMoradia TipoMoradia
    temOutrosAnimais Bool
    status StatusSolicitacao
    motivoResposta Text Maybe
    criadoEm UTCTime
    respondidoEm UTCTime Maybe
    deriving Show

Adocao json
    solicitacaoId SolicitacaoAdocaoId
    animalId AnimalId
    dataAdocao Day
    termoAceito Bool
    observacoes Text Maybe
    retornoPosAdocao Text Maybe
    UniqueAdocaoSolicitacao solicitacaoId
    UniqueAdocaoAnimal animalId
    deriving Show

Favorito json
    usuarioId UsuarioId OnDeleteCascade
    animalId AnimalId OnDeleteCascade
    criadoEm UTCTime
    UniqueFavorito usuarioId animalId
    deriving Show
|]
