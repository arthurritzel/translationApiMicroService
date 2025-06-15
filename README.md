# 🌍 Translation System

Sistema completo de tradução de textos com processamento assíncrono utilizando Node.js, Express, Prisma, PostgreSQL e RabbitMQ.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.9+-orange.svg)
![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)
![Prisma](https://img.shields.io/badge/Prisma-ORM-purple.svg)

## 📋 Visão Geral

O Translation System é uma solução completa para tradução de textos que permite:

- **API REST** para criar e consultar traduções
- **Processamento assíncrono** usando filas RabbitMQ
- **Workers/Consumers** que processam traduções usando Google Translate
- **Banco de dados PostgreSQL** com Prisma ORM
- **Documentação automática** com Swagger
- **Containerização** com Docker

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Client App    │───▶│ Translation  │───▶│   RabbitMQ      │
│                 │    │     API      │    │    Queue        │
└─────────────────┘    └──────────────┘ \  └─────────────────┘
                              │          \            │
                              ▼           \           ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │ PostgreSQL   │    │ Translation     │
                       │   Database   │    │   Consumer      │
                       └──────────────┘    └─────────────────┘
```

## 🚀 Funcionalidades

### Translation API
- ✅ **Criar tradução** - `POST /api/translation`
- ✅ **Consultar status** - `GET /api/translation/:requestId`
- ✅ **Listar traduções** - `GET /api/translation`
- ✅ **Health check** - `GET /health`
- ✅ **Documentação Swagger** - `/api-docs`

### Translation Consumer
- ✅ **Processamento assíncrono** de traduções
- ✅ **Google Translate** gratuito (sem API key)
- ✅ **Retry automático** em caso de falha
- ✅ **Fallback** para garantir funcionamento
- ✅ **Dead Letter Queue** para mensagens falhadas

### Funcionalidades Técnicas
- ✅ **Validação** com Yup
- ✅ **Logs estruturados** com cores
- ✅ **Migrações automáticas** com Prisma
- ✅ **Health checks** para containers
- ✅ **Escalabilidade horizontal**

## 📦 Tecnologias

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express** | 4.18+ | Framework web |
| **Prisma** | 5+ | ORM e query builder |
| **PostgreSQL** | 15+ | Banco de dados relacional |
| **RabbitMQ** | 3.9+ | Message broker |
| **Docker** | 20+ | Containerização |
| **Swagger** | 3+ | Documentação da API |

## 🛠️ Instalação e Configuração

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) e Docker Compose
- [Git](https://git-scm.com/)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/translationApiMicroService.git
cd translationApiMicroService
```

### 2. Configuração com Docker

```bash
# Copiar arquivo de ambiente
cp ./translations-api/.env.example ./translations-api/.env
cp ./translations-worker/.env.example ./translations-worker/.env

Editar variáveis se necessário

# Executar com Docker Compose
docker-compose up -d --build

# Verificar status dos serviços
docker-compose ps
```

## 🚀 Uso

### 1. Criar uma Tradução

```bash
curl -X POST http://localhost:4040/api/translation \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "sourceLang": "en",
    "targetLang": "pt"
  }'
```

**Resposta:**
```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "QUEUED",
  "message": "Translation request has been queued for processing",
  "createdAt": "2025-06-15T10:30:00.000Z"
}
```

### 2. Consultar Status

```bash
curl http://localhost:4040/api/translation/123e4567-e89b-12d3-a456-426614174000
```

**Resposta:**
```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "COMPLETED",
  "originalText": "Hello, how are you?",
  "translatedText": "Olá, como vai você?",
  "sourceLang": "en",
  "targetLang": "pt",
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-15T10:30:05.000Z"
}
```

### 3. Listar Traduções

```bash
curl "http://localhost:4040/api/translation"
```

## 📊 Status das Traduções

| Status | Descrição |
|--------|-----------|
| `QUEUED` | Tradução aguardando processamento na fila |
| `PROCESSING` | Tradução sendo processada pelo worker |
| `COMPLETED` | Tradução concluída com sucesso |
| `FAILED` | Falha no processo de tradução |

## 🐳 Docker

### Serviços Disponíveis

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| **translation-api** | 4040 | API REST principal |
| **translation-consumer** | - | Worker de processamento |
| **postgres** | 5432 | Banco de dados |
| **rabbitmq** | 5672, 15672 | Message broker + Management UI |


## 📚 Documentação da API

Após iniciar o sistema, acesse:

- **Swagger UI:** http://localhost:4040/docs
- **RabbitMQ Management:** http://localhost:15672 (admin/admin123)

## 🧪 Testes

### Teste Manual da API

```bash
# Health check
curl http://localhost:4040/health

# Criar tradução
curl -X POST http://localhost:4040/api/translation \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Isso é um teste",
    "sourceLang": "pt-br",
    "targetLang": "en-us"
  }'

# Verificar status (use o requestId retornado)
curl http://localhost:4040/api/translation/{requestId}
```

### Teste da Fila RabbitMQ

1. Acesse http://localhost:15672
2. Login: `admin` / `admin123`
3. Vá em **Queues** → `translationQueue`
4. Verifique mensagens sendo processadas

### Teste do Consumer

```bash
# Ver logs do consumer
docker-compose logs -f translation-consumer

# Devem aparecer mensagens como:
# "🔄 Processing translation: {requestId}"
# "✅ Translation completed for: {requestId}"
```

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
translationApiMicroService/
├── translation-api/           # API REST
│   ├── src/
│   │   ├── controllers/       # Controllers
│   │   ├── middlewares/       # Middlewares
│   │   ├── routes/           # Rotas
│   │   └── services/         # Serviços
│   ├── prisma/              # Schema e migrações
│   ├── config/              # Configurações
│   └── Dockerfile
├── translation-consumer/      # Worker/Consumer
│   ├── src/
│   │   ├── services/        # Serviços de tradução
│   │   └── consumer.js      # Consumer principal
│   └── Dockerfile
├── docker-compose.yml        # Orquestração
└── README.md
```
