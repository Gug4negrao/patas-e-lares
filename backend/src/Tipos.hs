module Tipos where

import Data.Aeson (FromJSON, ToJSON)
import Database.Persist.TH (derivePersistField)
import GHC.Generics (Generic)

data TipoUsuario = Adotante | Gestor
    deriving (Show, Read, Eq, Enum, Bounded, Generic)

data Sexo = Macho | Femea
    deriving (Show, Read, Eq, Enum, Bounded, Generic)

data Porte = Pequeno | Medio | Grande
    deriving (Show, Read, Eq, Enum, Bounded, Generic)

data StatusAnimal = Disponivel | EmProcesso | Adotado | Inativo
    deriving (Show, Read, Eq, Enum, Bounded, Generic)

data TipoRegistro = Vacina | Vermifugo | Consulta | Castracao
    deriving (Show, Read, Eq, Enum, Bounded, Generic)

data TipoMoradia = Casa | Apartamento | Outra
    deriving (Show, Read, Eq, Enum, Bounded, Generic)

data StatusSolicitacao = Pendente | Aprovada | Rejeitada | Cancelada
    deriving (Show, Read, Eq, Enum, Bounded, Generic)

instance ToJSON TipoUsuario
instance FromJSON TipoUsuario
instance ToJSON Sexo
instance FromJSON Sexo
instance ToJSON Porte
instance FromJSON Porte
instance ToJSON StatusAnimal
instance FromJSON StatusAnimal
instance ToJSON TipoRegistro
instance FromJSON TipoRegistro
instance ToJSON TipoMoradia
instance FromJSON TipoMoradia
instance ToJSON StatusSolicitacao
instance FromJSON StatusSolicitacao

derivePersistField "TipoUsuario"
derivePersistField "Sexo"
derivePersistField "Porte"
derivePersistField "StatusAnimal"
derivePersistField "TipoRegistro"
derivePersistField "TipoMoradia"
derivePersistField "StatusSolicitacao"
