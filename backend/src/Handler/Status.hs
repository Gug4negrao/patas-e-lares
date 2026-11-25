module Handler.Status (getStatusR) where

import Data.Aeson (Value, object, (.=))
import Data.Text (Text)
import Database.Persist.Sql (Single (..), rawSql)
import Yesod.Persist.Core (runDB)

import Foundation

getStatusR :: Handler Value
getStatusR = do
    resultado <- runDB (rawSql "SELECT 1" []) :: Handler [Single Int]
    let banco = if map unSingle resultado == [1] then "conectado" else "sem resposta" :: Text
    return $ object
        [ "status" .= ("ok" :: Text)
        , "banco"  .= banco
        ]
