# CaseTecnicoPaggo

# 📄 Paggo – OCR Case

## 🎯 Objetivo

Construir um sistema fullstack que permita:

- Upload de imagens
- Extração automática de texto via OCR
- Explicações e consultas sobre os dados extraídos usando um modelo de linguagem (LLM, como o GPT-4)

## ✅ Funcionalidades

- Autenticação de usuários (JWT)
- Upload de imagens
- Extração de texto com OCR (ex: OCR.space)
- Integração com LLM (ex: OpenAI GPT-4) para responder perguntas e explicar dados
- Histórico de documentos enviados

## 🔗 Acesso à aplicação

- 🔐 **Backend (API NestJS)**: [`https://paggo-backend-700c.onrender.com/api/status`](https://paggo-backend-700c.onrender.com/api/status)
- 🖥️ **Frontend (Next.js)**: [`https://paggo-frontend-ps59.onrender.com`](https://paggo-frontend-ps59.onrender.com)

> ℹ️ **Observação:** A API pode estar em estado de suspensão devido ao uso do plano gratuito da Render. Isso pode causar um pequeno atraso no primeiro carregamento. Mantenha a página aberta ou interaja com o sistema para evitar a suspensão automática.

## 🏗️ Estrutura do Projeto

```
📁 backend      # NestJS + Prisma (API REST com OCR e LLM)
📁 frontend     # Next.js (interface web)
```

## 🔧 Como rodar localmente

### 📌 Pré-requisitos

- Node.js (v20+)
- npm
- Conta e API key do [OCR.space](https://ocr.space/) e [OpenAI](https://platform.openai.com/)
- Banco de dados PostgreSQL configurado

## 🧠 Backend – NestJS + Prisma

### 📦 Instalar dependências

```bash
cd backend
npm install
```

### ⚙️ Variáveis de ambiente

Criar o arquivo `.env` na pasta `backend`:

```env
DATABASE_URL="postgresql://paggo:paggo@localhost:5432/paggo"

JWT_SECRET="sua_chave_secreta"

OCR_SPACE_KEY="sua_chave_ocr"

OPENAI_API_KEY="sua_chave_openai"
```

### 🛠️ Configurar Prisma

Ainda no ./backend
```bash
npx prisma migrate dev --name init
```

### 🚀 Iniciar API em modo dev

Ainda no ./backend
```bash
npm run start:dev
```

A API estará disponível em: `http://localhost:3000`

## 🐳 Banco de Dados (PostgreSQL)

# Sugestão de configuração do banco de dados

### Usando pgAdmin

1. Abra o pgAdmin e conecte-se ao servidor PostgreSQL local.
2. Clique com o botão direito em "Login/Group Roles" > "Create" > "Login/Group Roles".
3. No campo **Name**, digite: `paggo`.
4. Vá até a aba **"Definition"** e no campo **Password**, digite: `paggo`.
5. Clique em **Save** para criar o Login/Group Roles.
6. Vá até a aba **"Privileges"** e selecione "Can login?" e "Superuser?".
7. Clique com o botão direito em "Databases" > "Create" > "Database".
8. No campo **Database**, digite: `paggo`
9. No campo **Owner** selecione o `paggo`.
10. Clique em **Save** para criar o banco.

Certifique-se de que o seu arquivo `.env` do backend contenha:

```env
DATABASE_URL="postgresql://paggo:paggo@localhost:5432/paggo"
```

Caso queira configurar de outra forma ou seu postgresql esteja rodando em outra porta, configure o `.env`.

## 💻 Frontend – Next.js

### 📦 Instalar dependências

```bash
cd frontend
npm install
```

### ⚙️ Variáveis de ambiente

Atualize o arquivo `.env.local` na pasta `frontend`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 🚀 Rodar em modo desenvolvimento

Ainda no ./frontend
```bash
npm run dev
```

A interface estará disponível em: [http://localhost:3001](http://localhost:3001)
