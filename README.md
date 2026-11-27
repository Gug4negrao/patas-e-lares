# Patas & Lares

Sistema de adoção de animais. Instituições (ONGs e abrigos) cadastram animais, e adotantes buscam, favoritam e solicitam adoção. A instituição aprova ou rejeita cada solicitação.

Projeto final da disciplina de Haskell: backend em **Yesod** (API REST/JSON) e frontend em **React**.

**Acesse:** https://patas-e-lares.onrender.com · API: https://patas-e-lares-api.onrender.com/api/status

> A API está no plano gratuito do Render e "dorme" depois de 15 minutos sem acesso. O primeiro acesso depois disso pode levar até 1 minuto.

## Principais funcionalidades

- Cadastro e login de usuários (adotantes e instituições)
- Cadastro de instituições com endereço preenchido pelo CEP (ViaCEP)
- Cadastro de animais, com filtros de busca e histórico de saúde
- Catálogo de raças alimentado pela TheDogAPI
- Solicitação, aprovação e registro de adoção, além de favoritos

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Backend | Haskell (GHC 9.10), Yesod (`yesod-core`), Persistent, Warp, cabal |
| Banco de dados | PostgreSQL |
| Frontend | React + Vite + React Router |
| APIs externas | ViaCEP, TheDogAPI |
| Hospedagem | Render (site estático e API em Docker), Neon (PostgreSQL), GitHub Actions (imagem Docker) |

## Como executar

### 1. Banco de dados (PostgreSQL)

A API espera um banco `patas_e_lares` com usuário `patas` e senha `patas` em `localhost:5432`. Escolha uma opção:

- **A) Docker:** na raiz do projeto, `docker compose up -d`.
- **B) Instalador oficial do PostgreSQL para Windows:** depois de instalar, crie o usuário e o banco:
  ```sql
  CREATE ROLE patas LOGIN PASSWORD 'patas';
  CREATE DATABASE patas_e_lares OWNER patas;
  ```
- **C) PostgreSQL do MSYS2 que vem com o ghcup** (sem instalar mais nada). No Git Bash:
  ```bash
  export PATH="/c/ghcup/msys64/mingw64/bin:$PATH"
  /c/ghcup/msys64/usr/bin/env MSYSTEM=MINGW64 /c/ghcup/msys64/usr/bin/bash -lc "pacman -S --noconfirm mingw-w64-x86_64-postgresql"
  initdb -D C:/pgdata/patas-e-lares -U postgres -A trust -E UTF8 --locale=C
  pg_ctl -D C:/pgdata/patas-e-lares -l C:/pgdata/patas-e-lares.log start
  psql -U postgres -h localhost -c "CREATE ROLE patas LOGIN PASSWORD 'patas';" -c "CREATE DATABASE patas_e_lares OWNER patas;"
  ```
  Nas próximas vezes, basta o `pg_ctl ... start`.

### 2. Backend

Pré-requisitos: GHC 9.10 e cabal (instalados via [ghcup](https://www.haskell.org/ghcup/)).

> **Windows:** o pacote `persistent-postgresql` precisa da biblioteca `libpq`. Com o ghcup, instale-a pelo MSYS2 (comando `pacman` da opção C acima) e deixe `C:\ghcup\msys64\mingw64\bin` no `PATH` ao compilar e rodar.

```bash
cd backend
export PATH="/c/ghcup/msys64/mingw64/bin:$PATH"   # só no Windows
cabal update
cabal run patas-e-lares-api
```

A API sobe em `http://localhost:8080`. Teste com `curl http://localhost:8080/api/status`, que deve responder `{"banco":"conectado","status":"ok"}`.

> Se as respostas vierem num formato estranho, outro programa pode estar usando a mesma porta: no Windows o servidor não acusa erro nesse caso. Confira com `netstat -ano | findstr :8080` ou troque a porta com `PORT=8081`.

Variáveis de ambiente opcionais (padrões em [backend/.env.example](backend/.env.example)): `PORT`, `DATABASE_URL`, `DB_POOL`, `FRONTEND_ORIGIN`, `THEDOGAPI_KEY`.

> **TheDogAPI:** sem `THEDOGAPI_KEY` a API funciona normalmente, mas não importa as raças de cães. A chave é gratuita em [thedogapi.com](https://thedogapi.com) e fica só no servidor (nunca no frontend nem no repositório). No Windows, para não precisar defini-la a cada terminal: `[Environment]::SetEnvironmentVariable("THEDOGAPI_KEY", "sua-chave", "User")` no PowerShell e reabra o terminal. No Render, cadastre-a na aba **Environment** do serviço.

### 3. Frontend

Pré-requisitos: Node 18 ou mais recente (com npm). Deixe a API rodando em outro terminal.

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173`. O frontend chama a API em `http://localhost:8080/api`; se a API estiver em outro endereço ou porta, crie `frontend/.env` com `VITE_API_URL` (exemplo em [frontend/.env.example](frontend/.env.example)). Se mudar a porta do frontend, ajuste também `FRONTEND_ORIGIN` no backend, senão o navegador bloqueia as chamadas (CORS).

Para gerar a versão de produção: `npm run build` (arquivos em `frontend/dist/`).

Telas principais:

| Rota | Tela |
| --- | --- |
| `/` | Início |
| `/cadastro` e `/login` | Criar conta e entrar |
| `/perfil` | Dados do usuário logado |
| `/animais` e `/animais/{id}` | Animais disponíveis para adoção e ficha de cada um |
| `/meus-animais`, `/animais/novo`, `/especies` | Gestão dos animais e espécies (gestor) |
| `/instituicoes` | Instituição do gestor |
| `/racas` e `/racas/{id}` | Catálogo de raças de cães (TheDogAPI), com busca, e ficha da raça com os animais dela para adoção |
| `/minhas-solicitacoes` e `/favoritos` | Pedidos de adoção e animais favoritos do adotante |
| `/solicitacoes` | Pedidos recebidos pela instituição, com aprovar e rejeitar (gestor) |

Detalhes da organização do código em [frontend/README.md](frontend/README.md). O menu se reorganiza em telas estreitas (celular).

## Estrutura do backend

```
backend/
  app/Main.hs                  lê a config, abre o pool do banco e sobe o servidor
  config/routes.yesodroutes    todas as rotas da API
  src/Config.hs                variáveis de ambiente
  src/Foundation.hs            tipo App, instância Yesod, runDB, erros em JSON
  src/Application.hs           liga rotas aos handlers, CORS e log
  src/Models.hs                as 9 entidades do banco (Persistent)
  src/Tipos.hs                 tipos de valor fixo: status, porte, sexo...
  src/Banco.hs                 migração automática e dados iniciais
  src/DogApi.hs                comunicação com a TheDogAPI e importação das raças
  src/Senha.hs                 hash e conferência de senha (bcrypt)
  src/Handler/*.hs             um módulo por entidade (Comum e Filtros: funções compartilhadas)
  Dockerfile                   imagem usada na hospedagem
```

Para criar um endpoint: adicione a rota em `config/routes.yesodroutes`, crie a função no `src/Handler/<Entidade>.hs`, registre o módulo no `.cabal` (`exposed-modules`) e importe-o em `src/Application.hs`.

## Estrutura do banco de dados

As tabelas são criadas pela migração do Persistent ao subir a API, que também cadastra as espécies Cão e Gato. Todas têm `id` como chave primária.

| Tabela | Descrição | Relacionamentos |
| --- | --- | --- |
| `usuario` | Pessoas que usam o sistema. `tipo`: `Adotante` ou `Gestor` (quem administra uma instituição) | e-mail único |
| `instituicao` | ONGs e abrigos, com endereço completo | `usuario_id` → usuario (1 para 1) |
| `especie` | Cão, gato etc. | nome único |
| `raca` | Raças de cada espécie; as de cães vêm da TheDogAPI | `especie_id` → especie |
| `animal` | Animais anunciados. `status`: `Disponivel`, `EmProcesso`, `Adotado`, `Inativo` | `instituicao_id`, `especie_id`, `raca_id` (opcional) |
| `registro_saude` | Vacinas, vermífugos, consultas e castração do animal | `animal_id` → animal (apaga junto com o animal) |
| `solicitacao_adocao` | Pedido de adoção. `status`: `Pendente`, `Aprovada`, `Rejeitada`, `Cancelada` | `usuario_id`, `animal_id` |
| `adocao` | Adoção efetivada: data, termo, acompanhamento | `solicitacao_id` e `animal_id` únicos (um animal só é adotado uma vez) |
| `favorito` | Animais favoritados por um usuário | `usuario_id` + `animal_id` únicos; apaga junto com o usuário ou o animal |

Instituição, espécie, raça e animal com registros dependentes não podem ser excluídos (`ON DELETE RESTRICT`); a API responde `409`.

## Integração com APIs externas

| API | Finalidade |
| --- | --- |
| [ViaCEP](https://viacep.com.br) | Preencher o endereço das instituições a partir do CEP |
| [TheDogAPI](https://thedogapi.com) | Importar raças de cães (temperamento, expectativa de vida, imagem) para a tabela de raças |

## Endpoints

Erros sempre respondem `{"erro": "mensagem"}`, com status `400` (entrada inválida), `401` (login não confere), `403` (ação não permitida para o tipo de usuário), `404`, `409` (conflito com uma regra) ou `500`; nas integrações externas, também `502` (o serviço externo falhou) ou `503` (integração não configurada no servidor).

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET | `/api/status` | Verifica se a API e o banco estão no ar |
| GET | `/api/usuarios` | Lista os usuários (sem a senha) |
| POST | `/api/usuarios` | Cadastra um usuário |
| GET | `/api/usuarios/{id}` | Consulta um usuário |
| PUT | `/api/usuarios/{id}` | Atualiza nome, e-mail, telefone e, opcionalmente, a senha |
| DELETE | `/api/usuarios/{id}` | Exclui o usuário (`409` se ele administra uma instituição ou tem solicitações) |
| POST | `/api/login` | Confere e-mail e senha e devolve o usuário (`401` se não conferir) |
| GET | `/api/especies` | Lista as espécies |
| POST | `/api/especies` | Cadastra uma espécie (`409` se o nome já existe) |
| GET | `/api/especies/{id}` | Consulta uma espécie |
| PUT | `/api/especies/{id}` | Renomeia a espécie |
| DELETE | `/api/especies/{id}` | Exclui a espécie (`409` se tem raças ou animais) |
| GET | `/api/animais` | Lista os animais, com filtros opcionais (veja abaixo) |
| POST | `/api/animais` | Cadastra um animal (entra como `Disponivel`) |
| GET | `/api/animais/{id}` | Consulta um animal |
| PUT | `/api/animais/{id}` | Atualiza os dados do animal (instituição e status não mudam por aqui) |
| PATCH | `/api/animais/{id}/status` | Pausa ou volta a anunciar: aceita `Disponivel` ou `Inativo` |
| DELETE | `/api/animais/{id}` | Exclui o animal e seu histórico de saúde (`409` se tem solicitações ou adoção) |
| GET | `/api/animais/{id}/saude` | Histórico de saúde do animal, do mais recente ao mais antigo (filtro opcional `?tipo=`) |
| POST | `/api/animais/{id}/saude` | Inclui um registro de saúde |
| GET | `/api/saude/{id}` | Consulta um registro de saúde |
| PUT | `/api/saude/{id}` | Atualiza um registro de saúde |
| DELETE | `/api/saude/{id}` | Remove um registro de saúde |
| GET | `/api/racas` | Lista as raças em ordem alfabética, com filtros opcionais `?especie=` (id) e `?busca=` (trecho do nome) |
| GET | `/api/racas/{id}` | Consulta uma raça |
| POST | `/api/racas/sincronizar` | Importa ou atualiza as raças de cães a partir da TheDogAPI (`503` sem chave, `502` se a TheDogAPI falhar) |
| GET | `/api/instituicoes` | Lista as instituições |
| POST | `/api/instituicoes` | Cadastra a instituição de um gestor (`400` se o usuário não é `Gestor`, `409` se ele já tem uma) |
| GET | `/api/instituicoes/{id}` | Consulta uma instituição |
| PUT | `/api/instituicoes/{id}` | Atualiza os dados da instituição |
| DELETE | `/api/instituicoes/{id}` | Exclui a instituição (`409` se tem animais cadastrados) |
| GET | `/api/cep/{cep}` | Consulta o endereço no ViaCEP (`400` CEP inválido, `404` CEP inexistente, `502` ViaCEP fora do ar) |
| GET | `/api/solicitacoes` | Lista as solicitações, com filtros opcionais `usuario`, `animal`, `instituicao` (ids) e `status` |
| POST | `/api/solicitacoes` | Cria uma solicitação de adoção (`403` se não é adotante, `409` se o animal não está disponível ou já há pedido pendente do mesmo usuário) |
| GET | `/api/solicitacoes/{id}` | Consulta uma solicitação |
| DELETE | `/api/solicitacoes/{id}` | Cancela a solicitação, que fica no histórico como `Cancelada` (só se estiver `Pendente`) |
| PATCH | `/api/solicitacoes/{id}/aprovar` | Aprova: registra a adoção, marca o animal como `Adotado` e rejeita os outros pedidos pendentes dele |
| PATCH | `/api/solicitacoes/{id}/rejeitar` | Rejeita com um motivo (corpo `{ "motivo": "..." }`) |
| GET | `/api/adocoes` | Lista as adoções, com filtros opcionais `usuario`, `animal` e `instituicao` (ids) |
| GET | `/api/adocoes/{id}` | Consulta uma adoção |
| PUT | `/api/adocoes/{id}` | Atualiza observações e retorno pós-adoção |
| GET | `/api/usuarios/{id}/favoritos` | Lista os animais favoritos do usuário |
| POST | `/api/usuarios/{id}/favoritos` | Favorita um animal (corpo `{ "animalId": 3 }`; `409` se já é favorito) |
| DELETE | `/api/favoritos/{id}` | Remove um favorito |

Exemplo de cadastro (`POST /api/usuarios`):

```json
{ "nome": "Ana Souza", "email": "ana@email.com", "senha": "segredo1", "telefone": "11 99999-0000", "tipo": "Adotante" }
```

`tipo` aceita `Adotante` ou `Gestor`. `telefone` é opcional. A senha precisa ter pelo menos 6 caracteres e é guardada com hash bcrypt. No `PUT`, a `senha` só é trocada se for enviada; o `tipo` não muda.

### Animais

Exemplo de cadastro (`POST /api/animais`); no `PUT` o corpo é o mesmo, sem `instituicaoId`:

```json
{
  "instituicaoId": 1, "especieId": 1, "racaId": null,
  "nome": "Bolinha", "sexo": "Femea", "porte": "Pequeno",
  "nascimentoAprox": "2023-05-10", "descricao": "Carinhosa e brincalhona.",
  "fotoUrl": "https://exemplo.com/bolinha.jpg", "castrado": false
}
```

`sexo`: `Macho` ou `Femea`. `porte`: `Pequeno`, `Medio` ou `Grande`. `racaId`, `nascimentoAprox` e `fotoUrl` são opcionais; a raça precisa ser da espécie informada e a data não pode estar no futuro. A resposta já traz espécie, raça (com temperamento, expectativa de vida e imagem) e instituição:

```json
{
  "id": 1, "nome": "Bolinha", "sexo": "Femea", "porte": "Pequeno", "status": "Disponivel",
  "especie": { "id": 1, "nome": "Cão" },
  "raca": null,
  "instituicao": { "id": 1, "nome": "Abrigo Patinhas", "cidade": "Santos", "uf": "SP" },
  "...": "demais campos do cadastro e criadoEm"
}
```

Filtros de `GET /api/animais` (todos opcionais e combináveis): `especie`, `raca` e `instituicao` (ids), `sexo`, `porte`, `status`, `castrado` (`true`/`false`), `cidade` e `uf` (da instituição) e `busca` (trecho do nome). Exemplo: `/api/animais?especie=2&porte=Pequeno&status=Disponivel&uf=SP`.

O status `EmProcesso` e `Adotado` é definido pelo fluxo de solicitação e adoção; pelo `PATCH` de status o gestor só alterna entre `Disponivel` e `Inativo`. Para reaproveitar o formato de animal em outras respostas, use `animaisJson` de `Handler.Animal`.

### Registros de saúde

Exemplo (`POST /api/animais/1/saude`):

```json
{ "tipo": "Vacina", "descricao": "V10", "realizadoEm": "2026-10-01", "veterinario": "Dra. Ana" }
```

`tipo`: `Vacina`, `Vermifugo`, `Consulta` ou `Castracao`. `veterinario` é opcional. Registrar uma `Castracao` já marca o animal como castrado.

### Raças e TheDogAPI

As raças de cães vêm da [TheDogAPI](https://thedogapi.com), mas o frontend nunca fala com ela: o backend importa as raças para a tabela `raca` (ligadas à espécie Cão) e as rotas `/api/racas` leem do banco. Assim a chave fica no servidor e o catálogo continua funcionando se a TheDogAPI sair do ar.

- **Importação automática:** ao subir, se nenhuma raça veio da TheDogAPI ainda (banco novo, como no primeiro deploy), a API importa todas em segundo plano. Sem `THEDOGAPI_KEY`, só avisa no log.
- **Importação manual:** `POST /api/racas/sincronizar` busca a lista de novo e atualiza temperamento, expectativa de vida e imagem. Raças com o mesmo nome não são duplicadas.

Exemplo de resposta (`GET /api/racas?especie=1&busca=beagle`):

```json
[
  {
    "id": 12, "especieId": 1, "nome": "Beagle", "dogApiId": 31,
    "temperamento": "Friendly, gentle, alert, outgoing, curious, energetic",
    "expectativaVida": "10-15 anos",
    "imagemUrl": "https://cdn2.thedogapi.com/images/....jpg"
  }
]
```

### Instituições e CEP

Exemplo de cadastro (`POST /api/instituicoes`); no `PUT` o corpo é o mesmo:

```json
{
  "usuarioId": 2, "nome": "Abrigo Patinhas", "cnpj": null,
  "telefone": "11 3333-4444", "email": "contato@patinhas.org",
  "cep": "01001-000", "logradouro": "Praça da Sé", "numero": "100", "complemento": null,
  "bairro": "Sé", "cidade": "São Paulo", "uf": "SP"
}
```

O CEP é gravado só com os 8 dígitos e a UF em maiúsculas. Para preencher o endereço, o frontend chama `GET /api/cep/01001000`, que responde `{ "cep", "logradouro", "complemento", "bairro", "cidade", "uf" }` com os dados do ViaCEP.

### Solicitações e adoção

Exemplo (`POST /api/solicitacoes`):

```json
{ "usuarioId": 3, "animalId": 1, "mensagem": "Moro perto de um parque.", "tipoMoradia": "Apartamento", "temOutrosAnimais": false }
```

`tipoMoradia`: `Casa`, `Apartamento` ou `Outra`. O status do animal acompanha o fluxo:

| Acontecimento | Status do animal |
| --- | --- |
| Primeira solicitação recebida | `Disponivel` → `EmProcesso` |
| Solicitação aprovada | `Adotado` (as outras pendentes são rejeitadas automaticamente) |
| Última pendente cancelada ou rejeitada | volta a `Disponivel` |

A aprovação roda numa única transação: se qualquer passo falhar, nada é gravado. A resposta traz a solicitação e a adoção criada.

## Hospedagem

| Parte | Onde | Atualização |
| --- | --- | --- |
| Site (React) | Render, site estático | Automática a cada push na `main` |
| API (Yesod) | Render, imagem Docker `ghcr.io/gug4negrao/patas-e-lares-api` | Push que mexe em `backend/` → o GitHub Actions compila a imagem ([workflow](.github/workflows/backend.yml)) e avisa o Render pelo Deploy Hook |
| Banco | Neon (PostgreSQL), mesma região da API (US East) | As tabelas são criadas pela migração ao subir a API |

Variáveis configuradas no Render: no site, `VITE_API_URL`; na API, `DATABASE_URL`, `FRONTEND_ORIGIN`, `DB_POOL` e `THEDOGAPI_KEY`. Os valores secretos ficam só no Render, nunca no repositório.

Como cada push na `main` atualiza o site publicado, teste localmente antes de enviar.

## Integrantes

| Integrante | Principais contribuições |
| --- | --- |
| Gustavo | Base do backend, banco de dados, usuários e login, telas de conta, esqueleto do React e hospedagem |
| Isabelle | Animais, espécies e registros de saúde |
| Giovanna | Instituições e integração com ViaCEP |
| Júlia | Solicitações, adoção e favoritos |
| Filipi | Raças, integração com TheDogAPI e identidade visual do site |
