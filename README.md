# Sistema Delivey

## Visão Geral
O **Sistema Delivey** é uma aplicação full‑stack que unifica backend, frontend e painel administrativo para gerenciamento de entregas. Ele foi desenvolvido com **Node.js**, **Express**, **Prisma** e **SQLite** no backend, e **React** (Vite) no frontend e painel.

## Estrutura de Diretórios
```
Delivey System/
├─ backend/      # API REST com Prisma
├─ frontend/      # Interface cliente
├─ painel/        # Painel administrativo
├─ package.json   # Dependências e scripts raiz
└─ README.md      # Esta documentação
```

## Configuração
1. Copie os arquivos de exemplo de variáveis de ambiente:
   - `backend/.env.example` → `backend/.env.local`
   - `frontend/.env.example` → `frontend/.env.local`
   - `painel/.env.example` → `painel/.env.local`
2. Ajuste segredos, origens CORS e URLs conforme o ambiente.

## Backend
O backend fornece uma API única em `http://localhost:3000`.
```bash
cd backend
npm install
npx prisma migrate dev   # cria a base de dados SQLite
node seed.js            # popula dados iniciais
npm run dev             # inicia o servidor
```
### Credenciais iniciais
- **E‑mail:** `admin@delivey.local`
- **Senha:** `admin123456`

## Frontend
A aplicação cliente roda em `http://localhost:5173`.
```bash
cd frontend
npm install
npm run dev
```

## Painel Administrativo
O painel administrativo roda em `http://localhost:5174`.
```bash
cd painel
npm install
npm run dev
```

## Scripts Raiz
Para facilitar o desenvolvimento, há scripts que iniciam cada parte simultaneamente:
```bash
npm run dev:backend   # inicia o backend
npm run dev:frontend   # inicia o frontend
npm run dev:painel     # inicia o painel administrativo
npm run build          # gera builds de produção
npm run lint           # executa análise de código
```

## Tecnologias Utilizadas
- **Backend:** Node.js, Express, Prisma, SQLite
- **Frontend & Painel:** React, Vite, Tailwind CSS (ou CSS customizado)
- **Banco de Dados:** Prisma ORM com SQLite

## Próximos Passos
- Implementar autenticação JWT
- Integrar gateway de pagamento
- Deploy em ambiente de produção (Docker, Vercel ou Render)

---
*Esta documentação foi traduzida integralmente para o português brasileiro.*