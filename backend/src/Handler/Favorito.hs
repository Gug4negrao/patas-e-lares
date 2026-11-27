{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE OverloadedRecordDot #-}
module Handler.Favorito
    ( getFavoritosUsuarioR
    , postFavoritosUsuarioR
    , deleteFavoritoR
    ) where

import Control.Monad (when)
import Data.List (nub)
import qualified Data.Map.Strict as Map
import Data.Maybe (isJust)
import Data.Time (getCurrentTime)
import Database.Persist
import GHC.Generics (Generic)
import Network.HTTP.Types.Status
import Yesod.Core
import Yesod.Persist.Core (runDB)

import Foundation
import Handler.Animal (animaisJson)
import Handler.Comum
import Models

newtype Favoritar = Favoritar
    { animalId :: AnimalId
    } deriving Generic

instance FromJSON Favoritar

-- GET /api/usuarios/#id/favoritos
getFavoritosUsuarioR :: UsuarioId -> Handler Value
getFavoritosUsuarioR uid = do
    _ <- encontrarOu404 "Usuário não encontrado." uid
    favoritos <- runDB $ selectList [FavoritoUsuarioId ==. uid] [Desc FavoritoCriadoEm]
    toJSON <$> favoritosJson favoritos

-- POST /api/usuarios/#id/favoritos     corpo: { "animalId": 3 }
postFavoritosUsuarioR :: UsuarioId -> Handler Value
postFavoritosUsuarioR uid = do
    _ <- encontrarOu404 "Usuário não encontrado." uid
    dados <- lerJson :: Handler Favoritar
    _ <- encontrarOu404 "Animal não encontrado." dados.animalId
    existente <- runDB $ getBy (UniqueFavorito uid dados.animalId)
    when (isJust existente) $
        erroJson status409 "Este animal já está nos seus favoritos."
    agora <- liftIO getCurrentTime
    let favorito = Favorito
            { favoritoUsuarioId = uid
            , favoritoAnimalId  = dados.animalId
            , favoritoCriadoEm  = agora
            }
    fid <- runDB $ insert favorito
    lista <- favoritosJson [Entity fid favorito]
    case lista of
        (valor : _) -> sendStatusJSON status201 valor
        []          -> erroJson status500 "Erro ao montar os dados do favorito."

-- DELETE /api/favoritos/#id
deleteFavoritoR :: FavoritoId -> Handler Value
deleteFavoritoR fid = do
    _ <- encontrarOu404 "Favorito não encontrado." fid
    runDB $ delete fid
    responderSemConteudo

favoritosJson :: [Entity Favorito] -> Handler [Value]
favoritosJson favoritos = do
    animais <- runDB $ selectList
        [AnimalId <-. nub (map (favoritoAnimalId . entityVal) favoritos)] []
    animaisValores <- animaisJson animais
    let mapa = Map.fromList (zip (map entityKey animais) animaisValores)
    return
        [ object
            [ "id"       .= fid
            , "criadoEm" .= favoritoCriadoEm f
            , "animal"   .= Map.lookup (favoritoAnimalId f) mapa
            ]
        | Entity fid f <- favoritos
        ]
