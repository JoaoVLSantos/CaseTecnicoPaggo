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

## 🏗️ Estrutura do Projeto

```
📁 backend      # NestJS + Prisma (API REST com OCR e LLM)
📁 frontend     # Next.js (interface web)
```

## 🔧 Como rodar localmente

### 📌 Pré-requisitos

- Node.js (v20+)
- npm ou Yarn
- Conta e API key do [OCR.space](https://ocr.space/) e [OpenAI](https://platform.openai.com/)
- Banco de dados PostgreSQL configurado

## 🐳 Banco de Dados (PostgreSQL)

### Usando pgAdmin

1. Abra o pgAdmin e conecte-se ao servidor PostgreSQL local.
2. Clique com o botão direito em "Databases" > "Create" > "Database".
3. No campo **Database name**, digite: `paggo`
4. Vá até a aba **"Privileges"** e adicione um usuário chamado `paggo` com a senha `paggo` (ou configure conforme seu `.env`).
5. Clique em **Save** para criar o banco.

Certifique-se de que o seu arquivo `.env` do backend contenha:

```env
DATABASE_URL="postgresql://paggo:paggo@localhost:5432/paggo"
```

## 🧠 Backend – NestJS + Prisma

### 📦 Instalar dependências

```bash
cd backend
npm install
```

### ⚙️ Variáveis de ambiente

Atualize o arquivo `.env.example` na pasta `backend`:

```env
DATABASE_URL="postgresql://paggo:paggo@localhost:5432/paggo"
JWT_SECRET="sua_chave_secreta"
OCR_SPACE_KEY="sua_chave_ocr"
OPENAI_API_KEY="sua_chave_openai"
```

### 🛠️ Configurar Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 🚀 Iniciar API em modo dev

```bash
npm run start:dev
```

A API estará disponível em: `http://localhost:3000`

## 💻 Frontend – Next.js

### 📦 Instalar dependências

```bash
cd frontend
npm install
```

### ⚙️ Variáveis de ambiente

O arquivo `.env.local` na pasta `frontend`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 🚀 Rodar em modo desenvolvimento

```bash
npm run dev
```

A interface estará disponível em: [http://localhost:3001](http://localhost:3001)
