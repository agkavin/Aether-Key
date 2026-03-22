# Aether-Key

Universal BYOK (Bring Your Own Key) gateway for AI applications. Drop-in React component + FastAPI proxy that lets your users connect their own API keys — you never pay for LLM costs.

Supports **40+ cloud providers** (OpenAI, Anthropic, Groq, Gemini, Mistral, etc.) via [LiteLLM](https://github.com/BerriAI/litellm) and **local Ollama models** via the native ollama library.

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│   Your React App │────▶│   Aether-Key     │────▶│   Cloud Providers    │
│                  │     │   Proxy (FastAPI) │     │   (40+ via litellm)  │
│  ┌────────────┐  │     │                  │     │                      │
│  │ Modal/     │  │     └──────────────────┘     └──────────────────────┘
│  │ Search/    │  │
│  │ Vault UI   │  │     ┌──────────────────┐
│  └────────────┘  │────▶│   Ollama         │
│                  │     │   (localhost)     │
└──────────────────┘     └──────────────────┘
```

- **Users bring their own API keys** — they never touch your server
- **Ollama runs locally** — direct browser connection, no proxy overhead
- **Zero-knowledge** — keys encrypted client-side via Web Crypto API

## Quick Start

### 1. Install

```bash
npm install @aether-key/react
```

### 2. Wrap your app

```tsx
import { AetherKeyProvider, AetherKeyModal, useBYOK } from '@aether-key/react';
import '@aether-key/react/dist/index.css';

function App() {
  const { headers, isConfigured, model } = useBYOK();

  // headers contain X-Provider, X-API-Key, etc.
  // Use them in your fetch calls to the proxy

  return (
    <AetherKeyProvider proxyUrl="https://your-proxy.example.com">
      <YourApp />
    </AetherKeyProvider>
  );
}
```

### 3. Run the proxy

```bash
cd apps/proxy
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

## Project Structure

```
aether-key/
├── packages/react/          # @aether-key/react — UI component library
│   └── src/
│       ├── components/      # Modal, ProviderSearch, KeyVault, OllamaScanner, ConnectionStatus
│       ├── hooks/           # useBYOK, useProviderMetadata
│       ├── store/           # Zustand vault store
│       ├── utils/           # AES-256-GCM encryption, localStorage
│       └── types/           # TypeScript interfaces
│
├── apps/proxy/              # FastAPI gateway
│   ├── app/
│   │   ├── routes/          # /v1/chat/completions, /v1/validate, /v1/metadata
│   │   ├── services/        # litellm provider registry, ollama service
│   │   ├── middleware/      # Sensitive header redaction
│   │   └── config.py        # Environment configuration
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── examples/basic-chat/     # Demo chat app
```

## Components

| Component | Purpose |
|-----------|---------|
| `<AetherKeyProvider>` | Context wrapper — pass `proxyUrl` and optional `ollamaUrl` |
| `<AetherKeyModal>` | Connection modal with provider search, model selection, key input |
| `<ConnectionStatus>` | Pill badge showing connected model name |
| `useBYOK()` | Hook returning `{ headers, isConfigured, provider, model }` |
| `useVaultStore()` | Direct access to the Zustand vault state |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/metadata` | GET | List all cloud providers and models |
| `/v1/metadata/{provider}/fields` | GET | Required credential fields for a provider |
| `/v1/validate` | POST | Validate API key with a 1-token dry-run |
| `/v1/chat/completions` | POST | Universal chat gateway (OpenAI-compatible) |
| `/v1/ollama/models` | GET | Discover local Ollama models with metadata |
| `/v1/ollama/status` | GET | Check Ollama connectivity |
| `/v1/health` | GET | Health check |

## Storage Tiers

| Tier | Description |
|------|-------------|
| **Session** | Keys held in memory only, lost on refresh |
| **Local** | Plain localStorage — no encryption |
| **Encrypted** | AES-256-GCM encrypted via Web Crypto API before storage |

## Docker

```bash
cd apps/proxy
docker compose up --build
```

## Development

```bash
# Install dependencies
npm install

# Build the React library
npm run build

# Run the proxy
cd apps/proxy && source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Run the example app
npm run dev:example
```

## License

MIT
