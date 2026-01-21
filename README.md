# KeepUP — Sistema de Calendário Web

> Calendário interativo com sistema de cores personalizadas para marcação de dias.

## 📌 Descrição do Projeto

O **KeepUP** é uma aplicação web que implementa um calendário digital com funcionalidades de marcação de dias utilizando cores personalizadas. O sistema permite a criação de categorias visuais (cores com nomes) e a aplicação dessas categorias em datas específicas do calendário.

O projeto foi desenvolvido como trabalho acadêmico, tendo como objetivo principal a demonstração de competências em desenvolvimento webfrontend, incluindo manipulação do DOM, programação assíncrona, persistência de dados e uso de APIs HTML5.

A aplicação oferece dois modos de uso: com autenticação (login simplificado) e sem autenticação (modo anônimo). No modo autenticado, os dados são persistidos por usuário utilizando localStorage; no modo anônimo, os dados existem apenas durante a sessão ativa.

---

## ✨ Funcionalidades Implementadas

| Recurso | Descrição Técnica |
|---------|-------------------|
| **Cores Personalizadas** | CRUD de cores com nome e valor hexadecimal |
| **Marcação de Dias** | Associação de cores a datas específicas |
| **Login por Usuário** | Dados persistidos separadamente por email |
| **Modo Anônimo** | Dados temporários em memória (não persistidos) |
| **Feriados Nacionais** | Carregamento automático via API externa |
| **Navegação por Teclado** | Atalhos para navegação entre meses |
| **Interface Responsiva** | Layout adaptável a diferentes tamanhos de tela |

---

## 🛠️ Tecnologias e APIs Utilizadas

### Linguagens de Programação
- **JavaScript ES6+**: Lógica da aplicação, módulos, arrow functions, promises, async/await
- **HTML5**: Estrutura semântica da página
- **CSS3**: Estilização, animações, design responsivo

### Frameworks e Bibliotecas
- **TailwindCSS**: Framework CSS utilitário (via CDN) para estilização rápida

### APIs HTML5
| API | Funcionalidade |
|-----|----------------|
| **localStorage** | Persistência de cores, marcações e sessão do usuário |
| **History API** | Atualização da URL sem recarregamento (`?month=YYYY-MM`) |
| **Fetch API** | Requisições HTTP para API externa de feriados |

### APIs Externas
- **BrasilAPI**: Serviço web que fornece lista de feriados nacionais do Brasil

---

## ▶️ Instruções de Execução

### Requisitos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Ou servidor HTTP local (opcional)

### Execução Direta
1. Abrir o arquivo `index.html` diretamente no navegador
2. A aplicação será carregada imediatamente

### Execução com Servidor Local (opcional)
```bash
# Utilizando npx serve
npx serve .

# Ou utilizando Python
python3 -m http.server
```

### Fluxo de Uso
1. Na tela inicial, escolher entre login ou modo anônimo
2. Se logado, criar cores personalizadas através do painel "Gerenciar Cores"
3. Selecionar uma cor e clicar no dia desejado para marcação
4. Visualizar marcações clicando no dia no calendário

---

## 🧩 Arquitetura do Projeto

### Estrutura de Arquivos

```
KeepUP/
├── index.html              # Página principal (HTML + interface de login)
├── README.md               # Documentação geral do projeto
├── RELATORIO.md            # Documentação técnica detalhada
├── css/
│   └── styles.css          # Estilos customizados (variáveis, calendário, responsividade)
└── js/
    ├── main.js             # Entry point, inicialização, autenticação
    ├── calendar/
    │   └── calendar.js     # Lógica de renderização do calendário
    ├── ui/
    │   └── ui.js           # Manipulação de interface, modais, eventos DOM
    ├── data/
    │   └── data.js         # Gerenciamento de dados, localStorage, APIs
    └── utils/
        └── utils.js        # Funções auxiliares (datas, formatação, constantes)
```

### Fluxo de Dados

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   main.js    │ ──► │  data.js     │ ──► │ localStorage │
│  (início)    │     │  (dados)     │     │  (persist.)  │
└──────────────┘     └──────────────┘     └──────────────┘
      │                    │
      ▼                    ▼
┌──────────────┐     ┌──────────────┐
│   ui.js      │     │ calendar.js  │
│  (render)    │     │  (datas)     │
└──────────────┘     └──────────────┘
```

---

## ⚠️ Limitações Conhecidas

As seguintes limitações são intencionais, mantendo o escopo adequado para fins acadêmicos:

| Limitação | Justificativa |
|-----------|---------------|
| Sem autenticação real | Projeto demonstrativo, sem backend |
| Senhas em texto plano | Não implementado hash/criptografia |
| Sem validação de email | Validação apenas de preenchimento |
| API de feriados externa | Dependência de serviço terceiros |
| Máximo 4 cores por dia | Restrição de design do sistema |
| Sem edição de marcações | Escopo limitado à marcação |

---

## ✅ Checklist de Conformidade Técnica

### Estruturas Básicas de Programação
- ✅ Uso de variáveis (`let`, `const`)
- ✅ Estruturas condicionais (`if`, `else`)
- ✅ Estruturas de repetição (`for`, `for...of`)
- ✅ Funções (declarações e expressões)

### Objetos e Arrays
- ✅ Modelagem de entidades (objeto `Color`)
- ✅ Manipulação de listas (cores, marcações)
- ✅ Métodos de array: `map`, `filter`, `sort`, `reduce`, `find`

### Arrow Functions
- ✅ Uso em manipuladores de eventos
- ✅ Uso em callbacks de funções assíncronas

### Manipulação do DOM
- ✅ Leitura de dados de formulários
- ✅ Renderização dinâmica de elementos
- ✅ Atualização de conteúdo sem recarregamento

### Programação Assíncrona (Fetch/Ajax)
- ✅ Requisição a API pública (BrasilAPI)
- ✅ Indicador de estado de carregamento
- ✅ Tratamento e exibição de erros

### Promises e async/await
- ✅ Fluxo com `.then() / .catch()`
- ✅ Fluxo com `async/await` e `try/catch`

### APIs HTML5
- ✅ **localStorage**: Persistência de dados por usuário
- ✅ **History API**: Navegação entre meses via URL
- ✅ **Fetch API**: Requisições HTTP

### Acessibilidade e Experiência do Usuário
- ✅ Layout responsivo (mobile-first)
- ✅ Uso de semântica HTML5
- ✅ Rótulos acessíveis em elementos interativos
- ✅ Estados de foco visíveis

### Organização do Código
- ✅ Separação em múltiplos arquivos (`index.html`, `css/`, `js/`)
- ✅ Comentários sucintos e informativos
- ✅ Documentação clara (README, RELATORIO)

### Boas Práticas de Desenvolvimento
- ✅ Uso exclusivo de `let` e `const`
- ✅ Evitamento de variáveis globais desnecessárias
- ✅ Princípio da Responsabilidade Única (SRP)
- ✅ Tratamento de erros em blocos `try/catch`

---

## 🤖 Uso de Inteligência Artificial no Desenvolvimento

A ferramenta de inteligência artificial foi utilizada como recurso de apoio ao desenvolvimento, nas seguintes áreas:

| Área de Aplicação | Descrição |
|-------------------|-----------|
| **Documentação** | Estruturação e revisão de README e RELATORIO.md |
| **Organização de Código** | Sugestões de arquitetura e padrões de projeto |
| **Revisão de Código** | Identificação de melhorias e simplificações |
| **Resolução de Problemas** | Análise e sugestões de soluções para bugs |
| **Explicação de Conceitos** | Interpretação de APIs e conceitos técnicos |

O código principal, incluindo a lógica de negócio do calendário, estrutura HTML/CSS original, decisões de design e implementação dos requisitos obrigatórios, foi desenvolvido pelo programador responsável. A IA funcionou como ferramenta auxiliar, não como substituta do desenvolvimento.

---

## 📄 Licença

Projeto de uso educacional, disponível para consulta e estudo.

