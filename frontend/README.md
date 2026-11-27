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
  componentes/    partes reaproveitadas: logo, rodapé, histórico de saúde
public/
  favicon.svg     ícone da aba (o mesmo desenho do logo)
```

## Identidade visual

O logo é uma casa (lar) com uma pegada (patas) dentro: `<Logo />` em [src/componentes/Logo.jsx](src/componentes/Logo.jsx). As cores e medidas ficam em variáveis no topo de [src/estilos.css](src/estilos.css); use as variáveis em vez de escrever cores soltas.

| Variável | Cor | Uso |
| --- | --- | --- |
| `--cor-principal` | terracota `#b84d14` | botões, links, destaques |
| `--cor-secundaria` | verde-lar `#1f5f5b` | logo, rodapé, etiquetas, números |
| `--cor-mel` | mel `#f2b544` | detalhes e foco do teclado |
| `--cor-fundo` / `--cor-creme` | creme | fundo da página e áreas suaves |

Fontes (Google Fonts, carregadas no `index.html`): **Fredoka** nos títulos e **Nunito** no texto. Todas as combinações de cor de texto passam no contraste mínimo WCAG AA (4,5:1).

Classes prontas para novas telas: `cartao` (formulário centralizado; `cartao largo` para mais espaço), `cabecalho` (título + ações), `filtros`, `grade` + `ficha` (cards com foto), `selo selo-<Status>`, `botao` (link com cara de botão; `botao-secundario` para o contorno), `secundario` e `perigo` (botões), `erro` e `aviso` (mensagens), `detalhe` (texto de apoio). Abaixo de 920px o menu vira o botão "Menu"; abaixo de 640px as grades e fichas ficam em uma coluna.

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
