module Banco (prepararBanco) where

import Control.Monad (forM_)
import Control.Monad.IO.Class (liftIO)
import Data.Text (Text)
import Database.Persist.Sql

import Models

prepararBanco :: ConnectionPool -> IO ()
prepararBanco pool = flip runSqlPool pool $ do
    runMigration migrateAll
    forM_ especiesIniciais $ \nome -> insertUnique (Especie nome)
    total <- count ([] :: [Filter Especie])
    liftIO $ putStrLn $ "Banco pronto (" <> show total <> " especies cadastradas)"

especiesIniciais :: [Text]
especiesIniciais = ["Cão", "Gato"]
