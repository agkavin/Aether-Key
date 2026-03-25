# Aether-Ollama Web Interface

A high-performance, streaming chat UI for local Ollama models. Hosted at [ollama-chat.agkavin.dev](https://ollama-chat.agkavin.dev).

## Setup (CORS Bridge)

To allow the browser to communicate with your local Ollama instance, you must set the `OLLAMA_ORIGINS` environment variable.

### macOS / Linux
```bash
OLLAMA_ORIGINS="https://ollama-chat.agkavin.dev" ollama serve
```

### Windows (PowerShell)
```powershell
$env:OLLAMA_ORIGINS="https://ollama-chat.agkavin.dev"; ollama serve
```

## Development

```bash
cd aether-ollama
npm install
npm run dev
```

## Build & Deploy (Cloudflare Pages)

To deploy updates to Cloudflare Pages, run the following from the root of this project:

```bash
cd aether-ollama
npm run build
npx wrangler pages deploy ./dist --project-name aether-ollama --commit-dirty=true
```

---
*Derived from [ollama-chat.md](./ollama-chat.md)*
