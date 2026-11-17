# Grimório Arcano — Biblioteca de Magias D&D 5e

Uma biblioteca pessoal de magias para **Dungeons & Dragons 5ª Edição**, onde é possível pesquisar magias, consultar seus detalhes, favoritar e organizar tudo em grimórios personalizados.

O projeto utiliza a API pública do D&D 5e para buscar as magias e conta com um backend em Python (Flask) e banco de dados SQLite3 para armazenar favoritos e grimórios, permitindo consultar os dados salvos mesmo quando a API estiver indisponível.

---

## Funcionalidades

### Pesquisa de magias

- Busca por nome, ignorando diferenças de acentuação.
- Filtros por escola de magia, nível, tempo de conjuração e tipo de dano.
- Visualização dos detalhes de cada magia, incluindo componentes, alcance, duração, descrição, dano, escalonamento e classes.

### Favoritos

- Adicionar e remover magias dos favoritos.
- Acesso rápido a todas as magias favoritas.
- Persistência dos dados no SQLite.
- Possibilidade de adicionar favoritas aos grimórios sem perder o vínculo com os favoritos.

### Grimórios personalizados

- Criar quantos grimórios quiser.
- Editar nome e descrição.
- Adicionar e remover magias individualmente.
- Excluir grimórios com confirmação.
- Adicionar a mesma magia em diferentes grimórios.
- Impedir que uma magia seja adicionada duas vezes ao mesmo grimório.

### Outros recursos

- Interface responsiva com navegação lateral.
- Notificações para ações realizadas.
- Estados de carregamento e listas vazias.
- Tratamento de erros na comunicação com a API e o servidor.
- Cache local para reduzir consultas externas.
- Consulta offline das magias salvas em favoritos e grimórios.

---

## Tecnologias utilizadas

### Frontend

| Tecnologia   | Utilização                                         |
| ------------ | -------------------------------------------------- |
| React        | Construção da interface e gerenciamento de estado |
| Vite         | Servidor de desenvolvimento e build               |
| CSS Modules  | Estilização dos componentes                       |
| Lucide React | Ícones da interface                               |

### Backend

| Tecnologia        | Utilização                           |
| ----------------- | ------------------------------------ |
| Python 3.10+      | Linguagem principal do backend      |
| Flask             | Criação da API REST                  |
| Flask-CORS        | Comunicação entre frontend e backend |
| Requests          | Requisições à API externa            |
| SQLite3           | Banco de dados relacional            |
| Unittest / Pytest | Testes automatizados                 |

### API externa

- [D&D 5e API](https://www.dnd5eapi.co/) — utilizada para consultar a lista de magias e seus respectivos detalhes.

---

## Estrutura do projeto

O projeto foi organizado separando a interface, as rotas da API, as regras de negócio e o acesso ao banco de dados.

```text
.
├── app.py
├── requirements.txt
├── package.json
├── vite.config.js
├── index.html
├── README.md
│
├── data/
│   ├── spells-cache.json
│   └── grimoire.db
│
├── backend/
│   ├── config.py
│   ├── database/
│   │   └── db_manager.py
│   ├── models/
│   │   └── entities.py
│   ├── repositories/
│   │   ├── spell_repository.py
│   │   ├── favorite_repository.py
│   │   └── grimoire_repository.py
│   ├── services/
│   │   ├── exceptions.py
│   │   ├── dnd_api_service.py
│   │   └── library_service.py
│   ├── routes/
│   │   └── api_routes.py
│   └── tests/
│       └── test_library.py
│
└── src/
    ├── App.jsx
    ├── App.module.css
    ├── main.jsx
    ├── index.css
    │
    ├── services/
    │   └── apiClient.js
    │
    ├── utils/
    │   ├── spellHelpers.js
    │   └── spellHelpers.test.js
    │
    └── components/
        ├── Sidebar/
        ├── Header/
        ├── Filter/
        ├── Card/
        ├── CardModal/
        ├── GrimoiresView/
        ├── GrimoireFormModal/
        ├── AddToGrimoireModal/
        ├── SpellPickerModal/
        └── ConfirmDialog/
```

---

## Banco de dados

O SQLite3 é utilizado para armazenar as magias consultadas, os favoritos e os grimórios criados pelo usuário.

O banco `data/grimoire.db` é criado automaticamente na primeira execução, com suporte a chaves estrangeiras e controle de versão utilizando `PRAGMA user_version`.

### Tabelas

O banco possui quatro tabelas principais:

| Tabela            | Descrição                                   |
| ----------------- | ------------------------------------------- |
| `spells`          | Armazena os dados completos das magias.     |
| `favorites`       | Registra as magias marcadas como favoritas. |
| `grimoires`       | Armazena os grimórios personalizados.       |
| `grimoire_spells` | Relaciona magias e grimórios.               |

### Relacionamento entre as tabelas

A relação entre magias e grimórios é de muitos-para-muitos (N:N). Isso permite que uma mesma magia esteja presente em vários grimórios, enquanto cada grimório pode conter diversas magias.

A tabela associativa `grimoire_spells` possui uma restrição `UNIQUE (grimoire_id, spell_id)` para impedir duplicatas dentro do mesmo grimório.

### Regras de independência

Favoritos e grimórios funcionam de maneira independente:

- Favoritar uma magia não a adiciona automaticamente a um grimório.
- Remover uma magia dos favoritos não afeta os grimórios em que ela está presente.
- Remover uma magia de um grimório não altera seus favoritos.
- Excluir um grimório não apaga as magias dos outros grimórios nem os favoritos.
- Uma magia só é removida da tabela `spells` quando não possui mais vínculos com favoritos ou grimórios.

---

## Instalação e execução

### Pré-requisitos

Antes de começar, é necessário ter instalado:

- Python 3.10 ou superior.
- Node.js 20 ou superior.
- npm.

### 1. Clonar o projeto

```bash
git clone <url-do-repositorio>
cd <nome-do-projeto>
```

### 2. Configurar o backend

Crie e ative um ambiente virtual:

```bash
python3 -m venv .venv
```

**Linux / macOS:**

```bash
source .venv/bin/activate
```

**Windows (PowerShell):**

```powershell
.venv\Scripts\Activate.ps1
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

### 3. Configurar o frontend

Na raiz do projeto, execute:

```bash
npm install
```

### 4. Iniciar a aplicação

Abra dois terminais.

**Terminal 1 — Backend (Flask):**

```bash
python3 app.py
```

O backend será iniciado na porta `5000`.

**Terminal 2 — Frontend (React + Vite):**

```bash
npm run dev:frontend
```

O frontend será iniciado na porta `3000`.

Também é possível iniciar os dois serviços de uma vez, caso esteja utilizando o script unificado:

```bash
npm run dev
```

Depois, acesse:

[http://localhost:3000](http://localhost:3000)

---

## Integração com a D&D 5e API

O backend consulta a API pública do D&D 5e para obter a lista de magias e seus detalhes.

O endpoint utilizado para a listagem é:

```http
GET /api/spells
```

A consulta é feita através da API externa:

```text
https://www.dnd5eapi.co/api/2014/spells?lang=pt-BR
```

Os resultados são armazenados em cache no arquivo `data/spells-cache.json`, evitando consultas desnecessárias.

Também é possível forçar uma nova sincronização utilizando:

```http
GET /api/spells?refresh=true
```

Quando uma magia é favoritada ou adicionada a um grimório, seus dados completos são salvos no SQLite3. Dessa forma, as áreas de favoritos e grimórios continuam funcionando mesmo sem conexão com a API externa.

---

## Como utilizar

### Pesquisar magias

1. Acesse **Pesquisar magias** pela barra lateral.
2. Digite o nome da magia ou utilize os filtros disponíveis.
3. Clique em **Detalhar** para consultar todas as informações.
4. Utilize a estrela para adicionar ou remover uma magia dos favoritos.
5. Clique em **Grimório** para adicionar a magia a um ou mais grimórios.

### Favoritas

1. Acesse a área **Favoritas**.
2. Consulte todas as magias que foram salvas.
3. Abra os detalhes ou adicione uma magia a algum grimório.
4. Clique novamente na estrela para remover dos favoritos.

A remoção dos favoritos não interfere nos grimórios.

### Meus grimórios

1. Acesse **Meus grimórios**.
2. Clique em **Novo grimório**.
3. Informe o nome e, opcionalmente, uma descrição.
4. Clique em **Abrir** para visualizar as magias salvas.
5. Utilize **+ Adicionar magias** para incluir novas magias.
6. Utilize **Remover** para retirar uma magia daquele grimório.
7. Use **Editar** para alterar o nome ou a descrição.
8. Para excluir um grimório, utilize a opção **Excluir grimório** e confirme a ação.

---

## Testes automatizados

O projeto possui testes para verificar o funcionamento do backend, das operações no banco de dados e das funções auxiliares do frontend.

### Backend

Testes com Python, SQLite3 e Flask:

```bash
python3 -m unittest discover -s backend/tests -v
```

### Frontend

Testes dos helpers JavaScript:

```bash
npm run test:js
```

---

## Observações

- O banco de dados é criado automaticamente na primeira execução.
- O arquivo de cache das magias fica em `data/spells-cache.json`.
- Os dados salvos localmente permitem consultar favoritos e grimórios sem depender da disponibilidade da API externa.
- O frontend utiliza o proxy configurado no Vite para encaminhar as requisições `/api` ao backend Flask.

---

**Grimório Arcano** — Suas magias, seus grimórios, suas aventuras.
