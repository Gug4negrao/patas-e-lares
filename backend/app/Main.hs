module Main (main) where

import Control.Monad.IO.Class (liftIO)
import Control.Monad.Logger (runStdoutLoggingT)
import Database.Persist.Postgresql (withPostgresqlPool)
import Network.Wai.Handler.Warp (run)

import Application (criarAplicacao)
import Banco (prepararBanco)
import Config
import Foundation (App (..))

main :: IO ()
main = do
    config <- carregarConfig
    runStdoutLoggingT $
        withPostgresqlPool (cfgBanco config) (cfgTamanhoPool config) $ \pool -> liftIO $ do
            prepararBanco pool
            app <- criarAplicacao (App pool config)
            putStrLn $ "API do Patas & Lares em http://localhost:" <> show (cfgPorta config)
            run (cfgPorta config) app
