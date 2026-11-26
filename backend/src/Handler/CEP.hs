{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedRecordDot #-}

module Handler.CEP
    ( getCepR
    ) where

import Control.Exception (try, SomeException)
import Data.Aeson
import Data.Text (Text)
import qualified Data.Text as T
import GHC.Generics (Generic)
import Network.HTTP.Client
import Network.HTTP.Client.TLS (tlsManagerSettings)
import Network.HTTP.Types.Status
import Yesod.Core
import Control.Monad.IO.Class (liftIO)
import qualified Data.ByteString.Lazy as LBS
import Foundation

data DadosCEP = DadosCEP
    { cep :: Maybe Text
    , logradouro :: Maybe Text
    , complemento :: Maybe Text
    , bairro :: Maybe Text
    , localidade :: Maybe Text
    , uf :: Maybe Text
    , erro :: Maybe Text
    } deriving (Show, Generic)

instance FromJSON DadosCEP where
    parseJSON = genericParseJSON defaultOptions
        { fieldLabelModifier = id }

getCepR :: Text -> Handler Value
getCepR cepInformado = do
    let cepLimpo = T.filter (/= '-') (T.filter (/= ' ') cepInformado)

    if T.length cepLimpo /= 8 || not (T.all (\c -> c >= '0' && c <= '9') cepLimpo)
        then sendResponseStatus status400 (object ["erro" .= ("CEP inválido." :: Text)])
        else do
            manager <- liftIO $ newManager tlsManagerSettings

            let url = "https://viacep.com.br/ws/" ++ T.unpack cepLimpo ++ "/json/"

            resultado <- liftIO (try (do
                request <- parseRequest url
                httpLbs request manager) :: IO (Either SomeException (Response LBS.ByteString))
                )
            case resultado of
                Left _ ->
                    sendResponseStatus status502 (object ["erro" .= ("Falha ao consultar o ViaCEP." :: Text)])

                Right resposta -> do
                    case decode (responseBody resposta) of
                        Nothing ->
                            sendResponseStatus status502 (object ["erro" .= ("Resposta inválida do ViaCEP." :: Text)])

                        Just dados ->
                            if erro dados == Just "true"
                                then sendResponseStatus status404 (object ["erro" .= ("CEP não encontrado." :: Text)])
                                else return $ object
                                    [ "cep" .= dados.cep
                                    , "logradouro" .= dados.logradouro
                                    , "complemento" .= dados.complemento
                                    , "bairro" .= dados.bairro
                                    , "cidade" .= dados.localidade
                                    , "uf" .= dados.uf
                                    ]