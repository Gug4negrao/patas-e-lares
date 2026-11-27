module Main (main) where

import Control.Concurrent (forkIO)
import Control.Monad.IO.Class (liftIO)
import Control.Monad.Logger (runStdoutLoggingT)
import Database.Persist.Postgresql (withPostgresqlPool)
import Network.Wai.Handler.Warp (run)
import System.IO (BufferMode (..), hSetBuffering, stderr, stdout)

import Application (criarAplicacao)
import Banco (prepararBanco)
import Config
import DogApi (importarRacasSeVazio)
import Foundation (App (..))

main :: IO ()
main = do
    hSetBuffering stdout LineBuffering
    hSetBuffering stderr LineBuffering
    config <- carregarConfig
    runStdoutLoggingT $
        withPostgresqlPool (cfgBanco config) (cfgTamanhoPool config) $ \pool -> liftIO $ do
            prepararBanco pool
            _ <- forkIO (importarRacasSeVazio (cfgChaveDogApi config) pool)
            app <- criarAplicacao (App pool config)
            putStrLn $ "API do Patas & Lares em http://localhost:" <> show (cfgPorta config)
            run (cfgPorta config) app
