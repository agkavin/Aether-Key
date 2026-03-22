# Aether-Key — Universal BYOK Gateway
### Project Plan & Technical Documentation

**Project Codename:** Aether-Key  
**Author:** Kavin AG (@marcus)  
**Vision:** To become the "Connect Wallet" of the AI era — a standardized, secure, and plug-and-play interface for users to bring their own intelligence to any application.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Key Features](#3-key-features)
4. [How It Works](#4-how-it-works)
5. [Architecture](#5-architecture)
6. [Application Flow](#6-application-flow)
7. [API Specification](#7-api-specification)
8. [Tech Stack](#8-tech-stack)
9. [Security & Privacy Model](#9-security--privacy-model)
10. [File & Folder Structure](#10-file--folder-structure)
11. [Distribution Strategy](#11-distribution-strategy)
12. [Roadmap](#12-roadmap)

---

## 1. Problem Statement

Every developer building LLM-powered applications runs into the same three walls — independently, but universally.

### 1.1 The Cost Barrier
When you build agentic AI, RAG pipelines, or LLM-backed tools, the token consumption is enormous. As a solo developer or small team, you simply cannot afford to absorb the cost of your users' inference. Either you charge a premium, limit usage aggressively, or quietly burn money. None of these scale.

### 1.2 The Provider Lock-in Problem
Every new project starts with the same repetitive setup: hardcoding provider SDKs, writing boilerplate API clients, managing credentials per-environment, and building custom retry/error logic. Switching from OpenAI to Anthropic midway through a project is painful. Supporting both simultaneously is worse.

### 1.3 The Local-to-Production Gap
During development, most developers use Ollama with local models — fast, free, private. But the moment they deploy, the entire inference setup needs to change. There is no standard abstraction that treats Ollama and cloud providers as equals at the application layer.

### 1.4 The Privacy & Trust Gap
Users are increasingly aware that entering an API key into an unknown third-party website is a security risk. There is no standardized, trust-establishing interface for BYOK ("Bring Your Own Key") flows. Every app that tries to do this reinvents the UI, the storage logic, and the trust narrative — poorly.

---

## 2. Solution Overview

Aether-Key is a **two-part open-source system** — a React UI component and a Stateless FastAPI proxy — designed to be dropped into any AI application to enable BYOK flows instantly.

Think of it as your **personal OpenRouter**, but with one critical architectural difference:

| | OpenRouter | Aether-Key |
|---|---|---|
| Key Storage | Stored on their servers | Never stored — zero-knowledge |
| Trust Model | You trust their infrastructure | Keys live only in user's browser |
| Cost Model | You pay per token | User pays with their own key |
| Provider Support | Their supported list | Any LiteLLM-compatible provider |
| Local Models | No | Yes — Ollama auto-discovery |
| Self-hostable | No | Yes — Docker + one command |

The core mental shift: **Aether-Key is not a product you sell. It is infrastructure you embed.** It is designed to be used in every LLM project you build — your knowledge graph tool, your RAG app, your agentic framework — all sharing the same standardized BYOK interface.

---

## 3. Key Features

### 3.1 Smart UI Component (`@aether-key/react`)

#### Searchable Provider Registry
A dropdown interface powered by LiteLLM's model metadata. Users can search by provider name (Anthropic, OpenAI, Groq) or model name (claude-3-5-sonnet, gpt-4o, llama3). The registry is fetched live from the proxy's `/v1/metadata` endpoint, so it always reflects what the proxy currently supports.

#### Ollama Auto-Discovery
A client-side "Local Scan" that pings `localhost:11434` directly from the browser — **no server involved**. It fetches all locally available models and surfaces them in the provider list alongside cloud providers. This closes the local-to-production gap entirely from the UI side.

#### The Key Vault (Three Storage Tiers)
Users choose how their key is stored based on their own comfort level:

| Tier | How it Works | Use Case |
|---|---|---|
| **Session Only** | Key held in memory (Zustand state). Cleared on tab close or refresh. | Maximum security, short sessions |
| **Remember Me** | Key persisted to `localStorage` in plain text. | Convenience, trusted personal device |
| **With Passphrase** | Key encrypted with AES-256 using a user-defined passphrase before writing to `localStorage`. Decrypted only in-browser on demand. | Shared or semi-trusted devices |

#### Real-time Connection Validation
A "Test Connection" button that fires a minimal 1-token request through the proxy to the selected provider. Gives the user instant confirmation that their key works before they start using the app.

#### `useBYOK` Hook
The developer-facing API. A single React hook that returns the headers and configuration needed to make authenticated requests. Designed for a 10-minute integration — a developer should be able to add BYOK support to any existing project in one session.

```tsx
const { headers, isConfigured, provider } = useBYOK();

// Then in any API call:
fetch('/api/chat', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages })
});
```

---

### 3.2 Stateless Proxy Server (`aether-key/proxy`)

#### Universal LLM Routing
The proxy uses LiteLLM as its routing engine. Any request arriving in standard OpenAI format is automatically translated to the correct provider-specific format. This means one API call format works for every provider.

#### Zero-Knowledge Architecture
The proxy has no database, no key storage, no logging of sensitive headers. Keys arrive in the `X-API-Key` request header, are read into memory for the duration of the request, and are discarded when the response is sent. The server is architecturally incapable of accumulating user credentials.

#### Streaming Support (SSE)
Full Server-Sent Events (SSE) support for streaming responses. Responses are piped directly from the provider back to the client — the proxy never buffers the entire response in memory. This enables real-time "typewriter" output in the UI.

#### No-Log Middleware
A custom FastAPI middleware layer that redacts `X-API-Key` and other sensitive headers from all server logs before they are written. Even accidental log exposure cannot leak user credentials.

---

## 4. How It Works

The entire system rests on one elegant principle: **the API key never lives on the server. It travels with each request.**

### The BYOK Handshake

```
┌─────────────────────────────────────────────────────────────┐
│  1. User opens your app and clicks "Connect Your AI"         │
│  2. Aether-Key modal opens — user picks provider + enters key│
│  3. Key is stored according to user's chosen vault tier       │
│  4. "Test Connection" fires — 1-token probe confirms key works│
│  5. Modal closes. UI shows "Connected: Claude 3.5 Sonnet"    │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  6. User sends a prompt in your app                          │
│  7. useBYOK hook injects key into X-API-Key header           │
│  8. Request goes to your FastAPI proxy                       │
│  9. Proxy reads X-Provider → LiteLLM routes to correct API  │
│  10. Streaming response flows back to user                   │
│  11. Key is discarded. No trace on server.                   │
└─────────────────────────────────────────────────────────────┘
```

### The Local Model Path (Ollama)

When a user selects an Ollama model, the flow is different — and simpler. The browser talks **directly** to `localhost:11434`. The proxy is not involved at all. This means:
- Zero latency overhead from the proxy
- Works completely offline
- No authentication needed for local models

---

## 5. Architecture

```
╔══════════════════════════════════════════════════════════════════════╗
║                     CLIENT SIDE (Browser)                            ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐   ║
║  │              Aether-Key React Component                       │   ║
║  │                                                               │   ║
║  │  ┌─────────────────────┐    ┌──────────────────────────────┐ │   ║
║  │  │   Discovery Logic    │    │      Key Management Vault    │ │   ║
║  │  │                      │    │                              │ │   ║
║  │  │  • Ollama Auto-Scan  │    │  ┌─────────────────────┐    │ │   ║
║  │  │    fetch:localhost   │    │  │  Session Only        │    │ │   ║
║  │  │    :11434 (direct)   │    │  │  (Memory / Zustand)  │    │ │   ║
║  │  │                      │    │  ├─────────────────────┤    │ │   ║
║  │  │  • Cloud Provider    │    │  │  Remember Me         │    │ │   ║
║  │  │    Registry (from    │    │  │  (localStorage plain)│    │ │   ║
║  │  │    /v1/metadata)     │    │  ├─────────────────────┤    │ │   ║
║  │  └─────────────────────┘    │  │  With Passphrase     │    │ │   ║
║  │                              │  │  (AES-256 encrypted) │    │ │   ║
║  │  useBYOK() Hook              │  └─────────────────────┘    │ │   ║
║  │  → Injects X-API-Key         └──────────────────────────────┘ │   ║
║  │  → Injects X-Provider                                          │   ║
║  └──────────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════╝
        │                                          │
        │ Direct fetch (no proxy)         HTTPS POST (with headers)
        │ localhost:11434                 X-API-Key: sk-...
        ▼                                X-Provider: anthropic
╔══════════════════╗             ╔══════════════════════════════════╗
║  LOCAL MACHINE   ║             ║    STATELESS PROXY (FastAPI)     ║
║                  ║             ║                                  ║
║  Ollama Instance ║             ║  ┌───────────┐  ┌────────────┐  ║
║  (llama3, mistral║             ║  │/v1/metadata│  │/v1/validate│  ║
║   phi3, etc.)    ║             ║  └─────┬─────┘  └─────┬──────┘  ║
╚══════════════════╝             ║        │               │         ║
                                 ║  ┌─────▼───────────────▼──────┐  ║
                                 ║  │    /v1/chat/completions     │  ║
                                 ║  └─────────────┬──────────────┘  ║
                                 ║                │                  ║
                                 ║  ┌─────────────▼──────────────┐  ║
                                 ║  │      LiteLLM Engine         │  ║
                                 ║  │  (Router & Translator)      │  ║
                                 ║  │  Maps OpenAI format →       │  ║
                                 ║  │  provider-specific format   │  ║
                                 ║  └──────────┬──────────────────┘  ║
                                 ╚═════════════╪════════════════════╝
                                               │
                    ┌──────────────────────────┼────────────────────┐
                    │                          │                     │
                    ▼                          ▼                     ▼
           ┌──────────────┐         ┌──────────────┐      ┌──────────────┐
           │  OpenAI API  │         │ Anthropic API│      │Gemini / Groq │
           │              │         │              │      │   / Others   │
           └──────────────┘         └──────────────┘      └──────────────┘
```

### Architectural Principles

- **Stateless by design.** The proxy holds no session state, no database, no key cache. Every request is self-contained.
- **Key as a Bearer Token.** The API key is treated exactly like a bearer token — it proves identity per-request and is not stored anywhere in the system.
- **The proxy is a translator, not a gatekeeper.** Its only job is to accept a standard OpenAI-format payload, forward it to the right provider with the right key, and stream the response back.
- **Ollama is a first-class citizen.** Local models bypass the proxy entirely, making offline and development use seamless.

---

## 6. Application Flow

### 6.1 First-Time Setup Flow

```
User visits app
      │
      ▼
App detects useBYOK().isConfigured === false
      │
      ▼
Renders <AetherKeyModal /> (or custom trigger)
      │
      ├──► User clicks "Scan Local" → Browser pings localhost:11434
      │         └── Success: Ollama models listed
      │         └── Failure: "No local models found" (non-blocking)
      │
      ├──► User selects Provider from searchable dropdown
      │         └── Dropdown populated from GET /v1/metadata
      │
      ├──► User enters API Key in key input field
      │
      ├──► User selects storage preference (Session / Remember / Passphrase)
      │         └── If Passphrase: prompt for passphrase → AES-256 encrypt key
      │
      └──► User clicks "Test Connection"
                └── POST /v1/validate with key in header
                      ├── 200 OK → Show ✅ "Connected" → Close modal
                      └── Error  → Show ❌ error message → Retry
```

### 6.2 Returning User Flow (Cloud Provider)

```
User revisits app
      │
      ▼
useBYOK hook initializes
      │
      ├── Storage Tier = Session Only → Key is gone → Re-prompt
      │
      ├── Storage Tier = Remember Me → Read key from localStorage → Ready ✅
      │
      └── Storage Tier = Passphrase → Read encrypted blob from localStorage
                └── Prompt for passphrase → Decrypt in-browser → Ready ✅
```

### 6.3 Inference Request Flow (Cloud Provider)

```
User submits prompt in app
      │
      ▼
useBYOK hook injects headers:
  X-API-Key: <key from vault>
  X-Provider: anthropic
      │
      ▼
POST /v1/chat/completions → FastAPI Proxy
      │
      ▼
No-Log Middleware redacts X-API-Key from logs
      │
      ▼
LiteLLM reads X-Provider header
      │
      ▼
LiteLLM translates OpenAI payload → Anthropic format
LiteLLM injects key into Authorization header for Anthropic
      │
      ▼
Anthropic API processes request
      │
      ▼
SSE stream piped back through proxy → browser
      │
      ▼
Key is discarded. Request lifecycle ends.
```

### 6.4 Local Inference Flow (Ollama)

```
User selects Ollama model (e.g., llama3:8b)
      │
      ▼
useBYOK detects provider = ollama
      │
      ▼
Browser sends request DIRECTLY to localhost:11434/api/chat
(Proxy is NOT involved)
      │
      ▼
Ollama streams response back to browser
```

---

## 7. API Specification

### Base URL
```
https://your-proxy-domain.com
```

---

### `GET /v1/metadata`
Returns the list of all supported providers and models available through this proxy instance.

**Response:**
```json
{
  "providers": [
    {
      "id": "anthropic",
      "name": "Anthropic",
      "models": [
        { "id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "context_window": 200000 },
        { "id": "claude-3-opus-20240229",     "name": "Claude 3 Opus",     "context_window": 200000 }
      ]
    },
    {
      "id": "openai",
      "name": "OpenAI",
      "models": [
        { "id": "gpt-4o",      "name": "GPT-4o",       "context_window": 128000 },
        { "id": "gpt-4o-mini", "name": "GPT-4o Mini",  "context_window": 128000 }
      ]
    }
  ]
}
```

---

### `POST /v1/validate`
Performs a dry-run key validation. Fires a minimal 1-token request to the target provider to confirm the key is valid and active.

**Required Headers:**
```
X-API-Key: sk-ant-...
X-Provider: anthropic
```

**Response (Success):**
```json
{ "status": "ok", "provider": "anthropic", "model": "claude-3-5-sonnet-20241022" }
```

**Response (Failure):**
```json
{ "status": "error", "code": 401, "message": "Invalid API key provided." }
```

---

### `POST /v1/chat/completions`
The main inference gateway. Accepts standard OpenAI chat completions format. Routes to the correct provider via LiteLLM.

**Required Headers:**
```
X-API-Key: <provider api key>
X-Provider: <provider id>   (e.g., anthropic, openai, groq, gemini)
Content-Type: application/json
```

**Request Body (OpenAI Format):**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "messages": [
    { "role": "system",    "content": "You are a helpful assistant." },
    { "role": "user",      "content": "Explain transformers in one sentence." }
  ],
  "stream": true,
  "max_tokens": 512,
  "temperature": 0.7
}
```

**Response:** Server-Sent Events (SSE) stream in OpenAI delta format when `stream: true`. Standard JSON response when `stream: false`.

---

## 8. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **UI Component** | React 18+, TypeScript | Core component framework |
| **Styling** | Tailwind CSS | Utility-first styling, zero config |
| **Icons** | Lucide React | Consistent, lightweight icon set |
| **Global State** | Zustand | Key vault state management (in-memory tier) |
| **API Sync** | React Query (TanStack) | Provider metadata fetching & caching |
| **Encryption** | Web Crypto API / CryptoJS | AES-256 for passphrase-encrypted storage |
| **Backend** | FastAPI (Python) | High-performance async API server |
| **LLM Routing** | LiteLLM | Universal provider translation layer |
| **ASGI Server** | Uvicorn | Production-grade ASGI server |
| **Containerization** | Docker, Docker Compose | Self-hostable deployment |
| **Package Registry** | NPM | UI component distribution |

### Why These Choices

**LiteLLM** — Avoids writing and maintaining individual SDK integrations for each provider. One interface, 100+ providers. The trade-off is a dependency on their release cycle, mitigated by wrapping it behind your own provider interface.

**Zustand over Redux** — The key vault state is simple and localized. Zustand's minimal API is a better fit than Redux's overhead for this use case.

**Web Crypto API** — Native browser cryptography. No third-party library needed for AES-256 encryption, which reduces the bundle size and eliminates a supply-chain risk for security-critical code.

**FastAPI** — Async-first, excellent SSE/streaming support, automatic OpenAPI docs generation, and Python's ecosystem makes LiteLLM integration trivial.

---

## 9. Security & Privacy Model

Security is not a feature of Aether-Key — it is the core design constraint. Every architectural decision flows from one principle: **the server must be incapable of knowing what keys pass through it.**

### 9.1 No-Persistence Guarantee
The FastAPI proxy is explicitly forbidden from having a database, a cache layer, or any persistent storage mechanism. There is nothing to breach because there is nothing to store.

### 9.2 Key Transmission via Header (not Body)
API keys travel in the `X-API-Key` request header, never in the JSON body. Request bodies are more likely to be logged by intermediate infrastructure (load balancers, APMs). Headers are treated differently and are easier to redact.

### 9.3 No-Log Middleware
A custom middleware layer runs on every request and redacts `X-API-Key`, `Authorization`, and any other sensitive headers before the request is committed to any log output. Even with verbose logging enabled, keys cannot appear in log files.

### 9.4 In-Browser AES-256 Encryption
When a user opts into the passphrase tier, encryption and decryption happen entirely inside the browser using the Web Crypto API. The passphrase never leaves the device. The server never receives or sees the decrypted key until the user initiates a request — and then it is immediately discarded.

### 9.5 CORS Hardening
The proxy only accepts requests from a configurable whitelist of approved frontend origins, set via environment variable. This prevents unauthorized domains from using a deployed proxy instance as a free relay.

### 9.6 Threat Model Summary

| Threat | Mitigated By |
|---|---|
| Server data breach | No-persistence guarantee — nothing to steal |
| Log scraping | No-log middleware + header injection |
| Man-in-the-middle | HTTPS enforced in production |
| Unauthorized proxy use | CORS origin whitelist |
| Local storage theft | AES-256 passphrase encryption (optional tier) |
| Phishing via third-party deploy | Open source — anyone can audit the code |

---

## 10. File & Folder Structure

```
aether-key/
│
├── packages/
│   └── react/                          # @aether-key/react (NPM package)
│       ├── src/
│       │   ├── components/
│       │   │   ├── AetherKeyModal.tsx  # Main modal UI (provider select + key input)
│       │   │   ├── ProviderSearch.tsx  # Searchable provider/model dropdown
│       │   │   ├── KeyVault.tsx        # Storage tier selector UI
│       │   │   ├── OllamaScanner.tsx   # Local model discovery component
│       │   │   └── ConnectionStatus.tsx# "Connected / Not Configured" badge
│       │   │
│       │   ├── hooks/
│       │   │   ├── useBYOK.ts          # Primary developer-facing hook
│       │   │   ├── useOllamaDiscovery.ts# Pings localhost:11434
│       │   │   └── useProviderMetadata.ts# Fetches /v1/metadata via React Query
│       │   │
│       │   ├── store/
│       │   │   └── vaultStore.ts       # Zustand store for in-memory key state
│       │   │
│       │   ├── utils/
│       │   │   ├── encryption.ts       # AES-256 encrypt/decrypt (Web Crypto API)
│       │   │   └── storage.ts          # localStorage read/write helpers
│       │   │
│       │   ├── types/
│       │   │   └── index.ts            # Provider, Model, VaultConfig types
│       │   │
│       │   └── index.ts                # Package entry point (exports all public API)
│       │
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── apps/
│   └── proxy/                          # FastAPI Proxy Server
│       ├── app/
│       │   ├── main.py                 # FastAPI app init, CORS, middleware registration
│       │   │
│       │   ├── routes/
│       │   │   ├── metadata.py         # GET /v1/metadata
│       │   │   ├── validate.py         # POST /v1/validate
│       │   │   └── chat.py             # POST /v1/chat/completions (streaming)
│       │   │
│       │   ├── middleware/
│       │   │   └── redact_logs.py      # Strips sensitive headers before logging
│       │   │
│       │   ├── services/
│       │   │   ├── litellm_router.py   # LiteLLM wrapper + provider mapping logic
│       │   │   └── provider_registry.py# Loads and caches provider/model metadata
│       │   │
│       │   └── config.py               # Settings (CORS origins, allowed providers, etc.)
│       │
│       ├── Dockerfile
│       ├── docker-compose.yml
│       ├── requirements.txt
│       └── .env.example                # CORS_ORIGINS, ALLOWED_PROVIDERS, LOG_LEVEL
│
├── examples/
│   ├── basic-chat/                     # Minimal React app using @aether-key/react
│   ├── rag-app/                        # RAG pipeline with BYOK
│   ├── knowledge-graph/                # Text-to-graph with BYOK
│   └── agentic-chat/                   # Multi-step agent with BYOK
│
├── docs/
│   ├── Plan.md                         # This file
│   ├── ARCHITECTURE.md                 # Extended architecture notes
│   ├── SECURITY.md                     # Security model in depth
│   └── CONTRIBUTING.md
│
├── .github/
│   └── workflows/
│       ├── publish-npm.yml             # Auto-publish @aether-key/react on tag
│       └── docker-build.yml            # Build and push proxy Docker image
│
├── package.json                        # Monorepo root (npm workspaces)
├── turbo.json                          # Turborepo build config (optional)
└── README.md                           # Getting started, deploy buttons
```

---

## 11. Distribution Strategy

### 11.1 NPM Package (`@aether-key/react`)
The UI component is published as a public NPM package. Any developer can add BYOK support to their React app with:

```bash
npm install @aether-key/react
```

And in their app:

```tsx
import { AetherKeyModal, useBYOK } from '@aether-key/react';

// Wrap app with provider
<AetherKeyProvider proxyUrl="https://your-proxy.railway.app">
  <App />
</AetherKeyProvider>

// In any component
const { headers, isConfigured } = useBYOK();
```

### 11.2 Self-Hosted Proxy (Docker)
The proxy is distributed as a Docker image. One-command deployment:

```bash
docker compose up -d
```

The `docker-compose.yml` is configured with sensible defaults and a `.env.example` that makes setup a five-minute task.

### 11.3 One-Click Cloud Deployment
The README will include "Deploy to Railway" and "Deploy to Render" buttons. These allow non-Docker users to deploy the proxy to a cloud platform in under two minutes without writing any infrastructure code.

### 11.4 Monorepo Visibility
- Target submission to `awesome-llm` and `awesome-react` GitHub curated lists.
- Cross-promote with LiteLLM community (the proxy is a natural showcase for LiteLLM's routing capabilities).
- Developer blog post: "How I stopped paying for my users' AI tokens" — narrative-driven introduction to the BYOK pattern.

---

## 12. Roadmap

### Phase 1 — Core Infrastructure (MVP)
- [ ] FastAPI proxy with `/v1/metadata`, `/v1/validate`, `/v1/chat/completions`
- [ ] LiteLLM routing for OpenAI, Anthropic, Groq, Gemini
- [ ] No-log middleware + CORS hardening
- [ ] Docker + docker-compose setup
- [ ] React modal component (provider select + key input)
- [ ] `useBYOK` hook (Session Only storage tier)
- [ ] Real-time connection validation ("Test Connection")

### Phase 2 — Key Vault & Local Models
- [ ] Remember Me storage tier (plain localStorage)
- [ ] With Passphrase tier (AES-256 via Web Crypto API)
- [ ] Ollama auto-discovery (`localhost:11434` scan)
- [ ] Ollama direct-to-browser request path (bypass proxy)
- [ ] NPM package setup + publish workflow

### Phase 3 — DX Polish & Examples
- [ ] Full TypeScript types exported from package
- [ ] React Query integration for metadata caching
- [ ] `examples/` directory with basic-chat, RAG, knowledge-graph, agentic
- [ ] Deploy to Railway / Render one-click buttons
- [ ] Comprehensive README with integration guide

### Phase 4 — Community & Growth
- [ ] Submit to awesome-llm, awesome-react lists
- [ ] Developer blog post / video walkthrough
- [ ] Configurable UI theming (Tailwind CSS variables)
- [ ] Support for additional providers via LiteLLM updates
- [ ] Optional: Usage stats endpoint (non-sensitive, provider/model only, no keys)

---

### The Gotchas
Ollama CORS / Mixed Content — This is the most real technical blocker on the list. It will bite every single user on a deployed HTTPS app. Don't treat it as a docs problem — handle it in the component itself. Detect the block, show a clear error with the exact OLLAMA_ORIGINS command the user needs to run, copy button included. Make the fix one click away.

---

*Aether-Key is infrastructure, not a product. It is meant to be invisible to the end-user and effortless for the developer. Build once, embed everywhere.*
