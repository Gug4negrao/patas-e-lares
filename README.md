# Patas & Lares

Sistema de adoção de animais. Instituições (ONGs e abrigos) cadastram animais, e adotantes buscam, favoritam e solicitam adoção. A instituição aprova ou rejeita cada solicitação.

Projeto final da disciplina de Haskell: backend em **Yesod** (API REST/JSON) e frontend em **React**.

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
| Banco de dados | PostgreSQL 16 |
| Frontend | React + Vite |
| APIs externas | ViaCEP, TheDogAPI |

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
  src/Handler/*.hs             um módulo por entidade
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

Erros sempre respondem `{"erro": "mensagem"}`, com status `400`, `404`, `409` ou `500`; nas integrações externas, também `502` (o serviço externo falhou) ou `503` (integração não configurada no servidor).

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

## Integrantes

| Integrante | Principais contribuições |
| --- | --- |
| Integrante 1 | Base do backend, banco de dados, usuários e login |
| Integrante 2 | Animais, espécies e registros de saúde |
| Integrante 3 | Instituições e integração com ViaCEP |
| Integrante 4 | Solicitações, adoção e favoritos |
| Integrante 5 | Esqueleto do React, raças e integração com TheDogAPI |
