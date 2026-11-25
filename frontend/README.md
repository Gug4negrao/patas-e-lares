# Frontend do Patas & Lares

React + Vite. Precisa da API rodando (veja o README da raiz).

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173`. A URL da API é `http://localhost:8080/api` por padrão; para mudar, crie um `.env` com `VITE_API_URL` (exemplo em [.env.example](.env.example)).

## Estrutura

```
src/
  main.jsx        ponto de entrada (rotas e sessão)
  App.jsx         menu e lista de rotas
  api.js          função api() usada por todas as telas para chamar o backend
  sessao.jsx      usuário logado, guardado no localStorage
  estilos.css     estilos globais
  animais.js      textos de sexo/porte/status, cálculo de idade e buscas usadas nas telas de animais
  paginas/        uma tela por arquivo
  componentes/    partes reaproveitadas dentro das telas (ex.: histórico de saúde)
```

Para criar uma tela: adicione o arquivo em `src/paginas/`, registre a rota em `App.jsx` e use `api()` para falar com o backend. Erros da API chegam como exceção com a mensagem do campo `erro`.

## Telas de animais

| Rota | Tela |
| --- | --- |
| `/animais` | Catálogo de animais disponíveis, com filtros por nome, espécie, sexo, porte, cidade e UF |
| `/animais/:id` | Ficha do animal com histórico de saúde. O gestor da instituição dona do animal também edita, pausa, exclui e mantém os registros de saúde |
| `/animais/novo` e `/animais/:id/editar` | Formulário de cadastro e edição (só gestor) |
| `/meus-animais` | Todos os animais da instituição do gestor, com filtro por situação |
| `/especies` | Lista de espécies; gestores incluem, renomeiam e excluem |

As telas do gestor descobrem a instituição dele por `GET /api/instituicoes` (parte de instituições) e o formulário carrega as raças por `GET /api/racas?especie={id}` (parte de raças). Enquanto essas rotas não existirem, o formulário funciona sem a lista de raças.
