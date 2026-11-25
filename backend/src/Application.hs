{-# OPTIONS_GHC -Wno-orphans #-}
module Application (criarAplicacao) where

import Data.Text (Text)
import qualified Data.Text.Encoding as TE
import Network.Wai (Middleware)
import Network.Wai.Middleware.Cors
import Network.Wai.Middleware.RequestLogger (logStdoutDev)
import Yesod.Core

import Config
import Foundation
import Handler.Status
import Handler.Usuario

mkYesodDispatch "App" resourcesApp

criarAplicacao :: App -> IO Application
criarAplicacao app = do
    waiApp <- toWaiApp app
    let origem = cfgOrigemFrontend (appConfig app)
    return $ logStdoutDev $ liberarCors origem waiApp

liberarCors :: Text -> Middleware
liberarCors origem = cors $ const $ Just simpleCorsResourcePolicy
    { corsOrigins        = Just ([TE.encodeUtf8 origem], True)
    , corsMethods        = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    , corsRequestHeaders = ["Content-Type"]
    }
