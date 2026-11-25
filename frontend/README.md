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
  paginas/        uma tela por arquivo
```

Para criar uma tela: adicione o arquivo em `src/paginas/`, registre a rota em `App.jsx` e use `api()` para falar com o backend. Erros da API chegam como exceção com a mensagem do campo `erro`.
