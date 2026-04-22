# FlowTask AI

Aplicativo web de produtividade com IA real integrada.

> Versão web do projeto To Do List — reescrito em React com Claude API.

---

## ✦ Funcionalidades

- **IA real** — ao adicionar uma tarefa, a IA gera subtarefas, estima tempo, define prioridade e justifica
- **Pomodoro integrado** — timer 25/5min vinculado à tarefa, com contador de ciclos
- **CRUD completo** — adicionar, concluir, remover tarefas e subtarefas
- **Filtros e busca** — filtrar por status, buscar por texto em tempo real
- **Progresso visual** — barra de progresso geral + estatísticas
- **Persistência local** — dados salvos no `localStorage`

---

## 🛠️ Requisitos

- **Node.js 18+**
- **Vite** (bundler)
- Conta na [Anthropic](https://console.anthropic.com/) com API key

---

## 🚀 Como rodar

```bash
# 1. Criar projeto Vite (se ainda não existir)
npm create vite@latest flowtask-ai -- --template react
cd flowtask-ai

# 2. Instalar dependências
npm install

# 3. Substituir src/App.jsx pelo arquivo do repositório

# 4. Rodar em desenvolvimento
npm run dev
```

---

## 🔑 API Key

A aplicação usa a [Claude API](https://docs.anthropic.com/). A key é injetada automaticamente no ambiente Claude.ai.

Para rodar **fora** do Claude.ai, adicione um proxy ou passe a key via variável de ambiente — nunca exponha no frontend em produção.

---

## 📁 Estrutura

```
flowtask-ai/
├── src/
│   └── App.jsx        ← componente principal
├── public/
├── index.html
├── package.json
└── vite.config.js
```

---

## 🗂️ Formato de tarefa (localStorage)

```json
{
  "id": "<uuid>",
  "title": "Texto da tarefa",
  "completed": false,
  "createdAt": "2026-01-13T12:34:56.789Z",
  "subtasksDone": [],
  "ai": {
    "subtasks": ["subtarefa 1", "subtarefa 2"],
    "estimatedMinutes": 30,
    "priority": "alta",
    "priorityReason": "motivo em 1 frase",
    "pomodoroCount": 2
  }
}
```

---

## 🗺️ Roadmap

- [ ] Backend — FastAPI + PostgreSQL (multi-usuário)
- [ ] Autenticação — Google / e-mail
- [ ] Planos — free (5 análises/dia) · pago (ilimitado)
- [ ] PWA — instalável no celular
- [ ] Export — PDF / CSV das tarefas analisadas
- [ ] Histórico de produtividade por semana

---

## 📜 Licença

MIT © 2026 Fábio Júnior