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
  racas.js        busca sem acentos e separação dos temperamentos, usadas no catálogo de raças
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

As telas do gestor descobrem a instituição dele por `GET /api/instituicoes` (parte de instituições) e o formulário carrega as raças por `GET /api/racas?especie={id}` (parte de raças). Se a espécie não tiver raças cadastradas, o formulário funciona sem a lista de raças.

## Catálogo de raças

| Rota | Tela |
| --- | --- |
| `/racas` | Raças de cães com foto, expectativa de vida e temperamento. Busca por nome ou temperamento (sem diferenciar acentos) e botão "Mostrar mais" de 24 em 24. Gestores veem o botão "Atualizar pela TheDogAPI" (`POST /api/racas/sincronizar`) |
| `/racas/:id` | Ficha da raça, com os temperamentos em etiquetas e os animais dessa raça disponíveis para adoção (`GET /api/animais?raca={id}&status=Disponivel`) |

As telas nunca chamam a TheDogAPI diretamente: tudo passa pelo backend, que guarda as raças no banco e mantém a chave em segredo. A lista é carregada uma vez e filtrada no navegador, então a busca responde na hora.
