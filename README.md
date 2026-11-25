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

Variáveis de ambiente opcionais (padrões em [backend/.env.example](backend/.env.example)): `PORT`, `DATABASE_URL`, `DB_POOL`, `FRONTEND_ORIGIN`.

### 3. Frontend

_A ser preenchido pelo Integrante 5._

## Estrutura do backend

```
backend/
  app/Main.hs                  lê a config, abre o pool do banco e sobe o servidor
  config/routes.yesodroutes    todas as rotas da API
  src/Config.hs                variáveis de ambiente
  src/Foundation.hs            tipo App, instância Yesod, runDB, erros em JSON
  src/Application.hs           liga rotas aos handlers, CORS e log
  src/Handler/*.hs             um módulo por entidade
```

Para criar um endpoint: adicione a rota em `config/routes.yesodroutes`, crie a função no `src/Handler/<Entidade>.hs`, registre o módulo no `.cabal` (`exposed-modules`) e importe-o em `src/Application.hs`.

## Estrutura do banco de dados

_A ser preenchido no commit das entidades._

## Integração com APIs externas

| API | Finalidade |
| --- | --- |
| [ViaCEP](https://viacep.com.br) | Preencher o endereço das instituições a partir do CEP |
| [TheDogAPI](https://thedogapi.com) | Importar raças de cães (temperamento, expectativa de vida, imagem) para a tabela de raças |

## Endpoints

Erros sempre respondem `{"erro": "mensagem"}`, com status `400`, `404`, `409` ou `500`.

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET | `/api/status` | Verifica se a API e o banco estão no ar |

## Integrantes

| Integrante | Principais contribuições |
| --- | --- |
| Integrante 1 | Base do backend, banco de dados, usuários e login |
| Integrante 2 | Animais, espécies e registros de saúde |
| Integrante 3 | Instituições e integração com ViaCEP |
| Integrante 4 | Solicitações, adoção e favoritos |
| Integrante 5 | Esqueleto do React, raças e integração com TheDogAPI |
