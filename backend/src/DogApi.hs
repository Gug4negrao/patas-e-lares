-- | Integração com a TheDogAPI (https://thedogapi.com).
--
-- A chave da API fica só no backend (variável THEDOGAPI_KEY); o frontend
-- nunca fala direto com a TheDogAPI, só com as rotas do Yesod.
module DogApi
    ( RacaDogApi (..)
    , ErroDogApi (..)
    , mensagemErro
    , buscarRacasDogApi
    , salvarRacas
    ) where

import Control.Applicative ((<|>))
import Control.Exception (SomeException, try)
import Control.Monad.IO.Class (MonadIO)
import Data.Aeson
import Data.Aeson.Types (Parser, parseMaybe)
import qualified Data.ByteString.Lazy as LBS
import Data.Char (isDigit)
import Data.Maybe (mapMaybe)
import qualified Data.Set as Set
import Data.Text (Text)
import qualified Data.Text as T
import qualified Data.Text.Encoding as TE
import Database.Persist
import Database.Persist.Sql (SqlPersistT)
import Network.HTTP.Client
import Network.HTTP.Client.TLS (tlsManagerSettings)
import Network.HTTP.Types.Status (statusCode)
import Text.Read (readMaybe)

import Models

-- | Uma raça como vem da TheDogAPI, já com os campos que interessam ao sistema.
data RacaDogApi = RacaDogApi
    { dogId              :: Int
    , dogNome            :: Text
    , dogTemperamento    :: Maybe Text
    , dogExpectativaVida :: Maybe Text
    , dogImagemUrl       :: Maybe Text
    } deriving Show

instance FromJSON RacaDogApi where
    parseJSON = withObject "RacaDogApi" $ \o -> do
        idApi        <- (o .: "id") <|> (o .: "id" >>= lerId)
        nome         <- o .: "name"
        temperamento <- o .:? "temperament"
        vida         <- o .:? "life_span"
        imagem       <- o .:? "image"
        urlImagem    <- maybe (pure Nothing) (.:? "url") imagem
        referencia   <- o .:? "reference_image_id"
        pure RacaDogApi
            { dogId              = idApi
            , dogNome            = T.strip nome
            , dogTemperamento    = naoVazio temperamento
            , dogExpectativaVida = traduzirVida <$> naoVazio vida
            , dogImagemUrl       = naoVazio urlImagem <|> (urlPorReferencia <$> naoVazio referencia)
            }

-- | A TheDogAPI manda o id como texto ("1"); versões antigas mandavam número.
lerId :: Text -> Parser Int
lerId texto = maybe (fail "id da raça inválido") pure (readMaybe (T.unpack texto))

-- | Algumas raças vêm só com o id da imagem, sem o objeto "image".
urlPorReferencia :: Text -> Text
urlPorReferencia ref = "https://cdn2.thedogapi.com/images/" <> ref <> ".jpg"

-- | "12-15" -> "12-15 anos"; "10 - 12 years" -> "10 - 12 anos"
traduzirVida :: Text -> Text
traduzirVida vida
    | T.any isDigit (T.takeEnd 1 traduzida) = traduzida <> " anos"
    | otherwise                             = traduzida
  where
    traduzida = T.strip (T.replace "years" "anos" (T.replace "year" "ano" vida))

naoVazio :: Maybe Text -> Maybe Text
naoVazio valor = case T.strip <$> valor of
    Just t | not (T.null t) -> Just t
    _                       -> Nothing

data ErroDogApi
    = ChaveAusente          -- ^ THEDOGAPI_KEY não configurada
    | ChaveRecusada         -- ^ a TheDogAPI respondeu 401/403
    | FalhaConexao          -- ^ não foi possível falar com a TheDogAPI
    | FalhaHttp Int         -- ^ outro status HTTP inesperado
    | RespostaInvalida      -- ^ JSON em formato diferente do esperado
    | EspecieCaoAusente     -- ^ a espécie "Cão" não existe no banco
    deriving (Show, Eq)

mensagemErro :: ErroDogApi -> Text
mensagemErro erro = case erro of
    ChaveAusente      -> "Chave da TheDogAPI não configurada no servidor (variável THEDOGAPI_KEY)."
    ChaveRecusada     -> "A TheDogAPI recusou a chave configurada no servidor."
    FalhaConexao      -> "Falha ao consultar a TheDogAPI."
    FalhaHttp codigo  -> "A TheDogAPI respondeu com erro (HTTP " <> T.pack (show codigo) <> ")."
    RespostaInvalida  -> "Resposta inválida da TheDogAPI."
    EspecieCaoAusente -> "A espécie \"Cão\" não está cadastrada."

-- | Busca a lista completa de raças na TheDogAPI.
buscarRacasDogApi :: Maybe Text -> IO (Either ErroDogApi [RacaDogApi])
buscarRacasDogApi Nothing = return (Left ChaveAusente)
buscarRacasDogApi (Just chave) = do
    manager   <- newManager tlsManagerSettings
    resultado <- try $ do
        base <- parseRequest "https://api.thedogapi.com/v1/breeds"
        let requisicao = base { requestHeaders = [("x-api-key", TE.encodeUtf8 chave)] }
        httpLbs requisicao manager
    return $ case resultado of
        Left (_ :: SomeException) -> Left FalhaConexao
        Right resposta            -> interpretar resposta

interpretar :: Response LBS.ByteString -> Either ErroDogApi [RacaDogApi]
interpretar resposta = case statusCode (responseStatus resposta) of
    200 -> lerRacas (responseBody resposta)
    401 -> Left ChaveRecusada
    403 -> Left ChaveRecusada
    cod -> Left (FalhaHttp cod)

-- | Lê cada raça separadamente: uma raça em formato inesperado é ignorada
-- em vez de derrubar a importação inteira.
lerRacas :: LBS.ByteString -> Either ErroDogApi [RacaDogApi]
lerRacas corpo = case decode corpo of
    Nothing    -> Left RespostaInvalida
    Just itens ->
        let racas = mapMaybe (parseMaybe parseJSON) itens
        in if null racas && not (null (itens :: [Value]))
               then Left RespostaInvalida
               else Right racas

-- | Grava (ou atualiza) as raças na tabela Raca, ligadas à espécie "Cão".
-- Raças com o mesmo nome já cadastradas são completadas com os dados da API.
-- Devolve quantas raças diferentes foram sincronizadas (a API repete alguns nomes).
salvarRacas :: MonadIO m => [RacaDogApi] -> SqlPersistT m (Either ErroDogApi Int)
salvarRacas racas = do
    especie <- getBy (UniqueEspecieNome "Cão")
    case especie of
        Nothing -> return (Left EspecieCaoAusente)
        Just (Entity especieId _) -> do
            mapM_ (salvar especieId) racas
            return (Right (Set.size (Set.fromList (map dogNome racas))))
  where
    salvar especieId r = upsertBy
        (UniqueRaca especieId (dogNome r))
        Raca
            { racaEspecieId       = especieId
            , racaNome            = dogNome r
            , racaDogApiId        = Just (dogId r)
            , racaTemperamento    = dogTemperamento r
            , racaExpectativaVida = dogExpectativaVida r
            , racaImagemUrl       = dogImagemUrl r
            }
        [ RacaDogApiId        =. Just (dogId r)
        , RacaTemperamento    =. dogTemperamento r
        , RacaExpectativaVida =. dogExpectativaVida r
        , RacaImagemUrl       =. dogImagemUrl r
        ]
