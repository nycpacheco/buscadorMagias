# Grimório Arcano — Biblioteca Pessoal de Magias D&D 5e

Aplicação web full-stack para consultar magias de **Dungeons & Dragons 5ª Edição** diretamente pela API pública D&D 5e, favoritar magias e organizar múltiplos grimórios personalizados com persistência relacional local em **SQLite3** e backend **Python (Flask)** orientado a objetos.

---

## 1. Objetivo da Aplicação

Evoluir o buscador original de magias de D&D 5e para uma biblioteca arcana pessoal completa, permitindo que jogadores e mestres:

- Pesquisem e filtrem magias diretamente da API pública D&D 5e (`https://www.dnd5eapi.co`).
- Consultem detalhes completos das magias (escola, nível, componentes, dano, escalonamento, salvaguarda, área de efeito e classes).
- Marquem e desmarquem magias favoritas de forma independente.
- Criem, editem, consultem e excluam quantos grimórios personalizados desejarem.
- Adicionem a mesma magia a múltiplos grimórios e removam magias de um grimório sem afetar favoritos ou outros grimórios.
- Consultem suas favoritas e seus grimórios mesmo quando a API externa estiver indisponível, utilizando os dados persistidos localmente no banco SQLite3.

---

## 2. Funcionalidades Disponíveis

- **Barra lateral de navegação responsiva** com três áreas principais:
  - **Pesquisar magias**: buscador com pesquisa por nome (ignorando acentos) e filtros por escola, nível, tempo de conjuração e tipo de dano.
  - **Favoritas**: listagem das magias favoritadas armazenadas no SQLite, com os mesmos cards detalhados do buscador e opção de adicionar a grimórios ou desfavoritar.
  - **Meus grimórios**: criação, edição (nome e descrição), abertura, inclusão/remoção individual de magias e exclusão com diálogo de confirmação.
- **Sistema de favoritos independente**: estrela interativa nos cards e no modal de detalhes, com persistência imediata no SQLite.
- **Sistema de grimórios muitos-para-muitos**: uma magia pode pertencer a vários grimórios; um grimório pode conter várias magias; duplicatas no mesmo grimório são impedidas por validação de serviço e constraint `UNIQUE`.
- **Feedback visual e resiliência**: notificações discretas (toasts), estados de carregamento, estados vazios informativos e tratamento de erros de rede/API.

---

## 3. Tecnologias Utilizadas

### Frontend
- **React 19** (JavaScript / JSX)
- **Vite** (empacotador e servidor de desenvolvimento)
- **CSS Modules** (`*.module.css`) com variáveis CSS temáticas
- **Lucide React** (ícones vetoriais)

### Backend
- **Python 3.10+** (Orientação a Objetos)
- **Flask** + **Flask-CORS** (API REST HTTP/JSON)
- **SQLite3** (banco de dados relacional nativo do Python, com `PRAGMA foreign_keys = ON`)
- **Requests** (cliente HTTP para integração com a API D&D 5e)

---

## 4. Arquitetura Geral

A arquitetura separa claramente apresentação, comunicação HTTP, regras de negócio, acesso a dados e integração externa:

1. **Frontend (React + CSS Modules)** envia requisições HTTP/JSON para `/api/*` (nunca acessa o SQLite diretamente).
2. **Camada de Rotas (`backend/routes/api_routes.py`)**: recebe requisições HTTP, delega ao serviço e retorna JSON padronizado com tratamento centralizado de exceções.
3. **Camada de Serviços (`backend/services/`)**:
   - `DndApiService`: consulta a API D&D 5e (`pt-BR`), aplica retentativas e gerencia o cache local `data/spells-cache.json`.
   - `LibraryService`: implementa regras de negócio de favoritos, grimórios, validação de campos e independência entre entidades.
4. **Camada de Repositórios (`backend/repositories/`)**: encapsula consultas SQL parametrizadas e transações (`SpellRepository`, `FavoriteRepository`, `GrimoireRepository`).
5. **Camada de Modelos (`backend/models/entities.py`)**: classes OOP (`Spell`, `Favorite`, `Grimoire`, `GrimoireSpell`).
6. **Camada de Banco (`backend/database/db_manager.py`)**: gerencia conexões SQLite, ativa chaves estrangeiras e executa inicialização/migração automática via `PRAGMA user_version`.

---

## 5. Estrutura de Pastas

```text
.
├── app.py                              # Ponto de entrada do backend Python Flask
├── requirements.txt                    # Dependências Python
├── server.js                           # Proxy/host de desenvolvimento (porta 3000 -> Flask 5000)
├── package.json                        # Scripts e dependências do frontend
├── vite.config.js                      # Configuração Vite + proxy /api -> Flask
├── index.html                          # HTML principal
├── README.md                           # Documentação do projeto
├── data/
│   ├── spells-cache.json               # Cache local opcional da listagem D&D 5e
│   └── grimoire.db                     # Banco SQLite3 (gerado automaticamente na 1ª execução)
├── backend/
│   ├── config.py                       # Constantes e caminhos de configuração
│   ├── database/
│   │   └── db_manager.py               # Conexão SQLite3, PRAGMA foreign_keys e migrações
│   ├── models/
│   │   └── entities.py                 # Classes OOP (Spell, Favorite, Grimoire, GrimoireSpell)
│   ├── repositories/
│   │   ├── spell_repository.py         # Persistência da tabela spells e limpeza de órfãs
│   │   ├── favorite_repository.py      # CRUD da tabela favorites
│   │   └── grimoire_repository.py      # CRUD de grimoires e grimoire_spells
│   ├── services/
│   │   ├── exceptions.py               # Exceções de domínio (400, 404, 409, 502)
│   │   ├── dnd_api_service.py          # Integração HTTP com a API D&D 5e
│   │   └── library_service.py          # Regras de negócio da biblioteca pessoal
│   ├── routes/
│   │   └── api_routes.py               # Controlador REST Flask (/api/*)
│   └── tests/
│       └── test_library.py             # Testes automatizados do banco, OOP e API Flask
└── src/
    ├── App.jsx                         # Aplicação principal e estado das 3 áreas
    ├── App.module.css
    ├── main.jsx
    ├── index.css
    ├── services/
    │   └── apiClient.js                # Cliente HTTP/JSON para o backend Python
    ├── utils/
    │   ├── spellHelpers.js             # Formatação, tradução e filtragem de magias
    │   └── spellHelpers.test.js        # Testes unitários das funções auxiliares
    └── components/
        ├── Sidebar/                    # Barra lateral responsiva de navegação
        ├── Header/                     # Cabeçalho contextualizado
        ├── Filter/                     # Barra de pesquisa e filtros
        ├── Card/                       # Card de magia com estrela e ação de grimório
        ├── CardModal/                  # Modal de detalhes completos da magia
        ├── GrimoiresView/              # Listagem e visualização interna de grimórios
        ├── GrimoireFormModal/          # Formulário de criação/edição de grimório
        ├── AddToGrimoireModal/         # Associação de uma magia a múltiplos grimórios
        ├── SpellPickerModal/           # Seletor de magias dentro de um grimório
        └── ConfirmDialog/              # Confirmação antes de excluir grimório
```

---

## 6. Modelagem do Banco de Dados SQLite3 (4 Tabelas Relacionais)

O banco é criado automaticamente em `data/grimoire.db` com `PRAGMA foreign_keys = ON`.

### 1. `spells`
Armazena os detalhes completos das magias salvas localmente (favoritadas ou vinculadas a grimórios), permitindo consulta offline sem depender de novas requisições à API.
- `id` (`INTEGER PRIMARY KEY AUTOINCREMENT`)
- `api_index` (`TEXT NOT NULL UNIQUE`) — identificador da magia na API D&D 5e (ex.: `fireball`)
- `name`, `level`, `school_index`, `school_name`, `casting_time`, `spell_range`, `components`, `material`, `duration`, `ritual`, `concentration`, `description`, `higher_level`, `additional_info`, `raw_data`, `updated_at`

### 2. `favorites`
Armazena as magias favoritadas pelo usuário.
- `id` (`INTEGER PRIMARY KEY AUTOINCREMENT`)
- `spell_id` (`INTEGER NOT NULL UNIQUE`) — `FOREIGN KEY (spell_id) REFERENCES spells(id) ON DELETE CASCADE`
- `created_at` (`TEXT NOT NULL`)

### 3. `grimoires`
Armazena os grimórios criados pelo usuário.
- `id` (`INTEGER PRIMARY KEY AUTOINCREMENT`)
- `name` (`TEXT NOT NULL`)
- `description` (`TEXT NOT NULL DEFAULT ''`)
- `created_at` (`TEXT NOT NULL`)
- `updated_at` (`TEXT NOT NULL`)

### 4. `grimoire_spells`
Tabela associativa muitos-para-muitos (`N:N`) entre `grimoires` e `spells`.
- `id` (`INTEGER PRIMARY KEY AUTOINCREMENT`)
- `grimoire_id` (`INTEGER NOT NULL`) — `FOREIGN KEY (grimoire_id) REFERENCES grimoires(id) ON DELETE CASCADE`
- `spell_id` (`INTEGER NOT NULL`) — `FOREIGN KEY (spell_id) REFERENCES spells(id) ON DELETE CASCADE`
- `added_at` (`TEXT NOT NULL`)
- Constraint `UNIQUE (grimoire_id, spell_id)` impedindo magias duplicadas no mesmo grimório.

### Regras de Independência
- Favoritar uma magia **não** a adiciona a nenhum grimório.
- Desfavoritar uma magia **não** a remove dos grimórios aos quais pertence.
- Remover uma magia de um grimório ou excluir um grimório **não** apaga os favoritos nem outros grimórios.
- A remoção automática da tabela `spells` só ocorre quando a magia não pertence mais nem a `favorites` nem a `grimoire_spells`.

---

## 7. Instalação e Execução do Zero

### Pré-requisitos
- **Python 3.10+** (com `sqlite3` nativo e `pip`)
- **Node.js 20+** e **npm**

### 1. Instalar dependências do Backend Python
```bash
python3 -m venv .venv
source .venv/bin/activate   # No Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Instalar dependências do Frontend
```bash
npm install
```

### 3. Executar em ambiente de desenvolvimento

#### Opção A — Em dois terminais (recomendado para desenvolvimento local)
Terminal 1 (Backend Python Flask na porta `5000`):
```bash
python3 app.py
```

Terminal 2 (Frontend Vite na porta `3000`, com proxy automático `/api` → `5000`):
```bash
npm run dev:frontend
```

#### Opção B — Comando único integrado
```bash
npm run dev
```
O `server.js` inicia automaticamente o backend Python Flask (`app.py` na porta `5000`) e serve o frontend Vite na porta `3000`, encaminhando todas as chamadas `/api/*` ao servidor Python.

Acesse no navegador: `http://localhost:3000`

---

## 8. Integração com a API D&D 5e e Banco SQLite

- O endpoint `GET /api/spells` no backend Python consulta `https://www.dnd5eapi.co/api/2014/spells?lang=pt-BR` e os detalhes de cada magia, mantendo `data/spells-cache.json` como cache de aceleração (com opção `?refresh=true` para forçar atualização).
- Sempre que o usuário favorita uma magia ou a adiciona a um grimório, o backend garante que os dados completos da magia estejam salvos na tabela `spells` do SQLite (`data/grimoire.db`).
- Assim, as áreas **Favoritas** e **Meus grimórios** funcionam integralmente com dados locais mesmo se a API D&D 5e ficar indisponível.

---

## 9. Testes Automatizados

### Testes do Backend (Python + SQLite3 + Flask)
```bash
python3 -m unittest discover -s backend/tests -v
```

### Testes dos Helpers do Frontend (JavaScript)
```bash
npm run test:js
```

---

## 10. Como Utilizar a Aplicação

1. **Pesquisar magias**: digite o nome da magia ou combine filtros por escola, nível, tempo de conjuração e tipo de dano. Clique em **Detalhar** para ver todas as propriedades, **⭐** para favoritar ou **Grimório** para associar a um grimório.
2. **Favoritas**: acesse pela barra lateral para consultar suas magias favoritas, adicioná-las a grimórios ou removê-las dos favoritos.
3. **Meus grimórios**: crie novos grimórios informando nome e descrição, abra um grimório para adicionar/remover magias, edite suas informações ou exclua com confirmação segura.
