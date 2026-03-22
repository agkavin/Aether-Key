# PRD: Aether-Key (Universal BYOK Gateway)

**Project Codename:** Aether-Key  
**Vision:** To become the "Connect Wallet" of the AI era—a standardized, secure, and plug-and-play interface for users to bring their own intelligence to any application.  
**Developer:** Kavin AG (@marcus)  

---

## 1. Executive Summary
Aether-Key is an open-source, two-part system (React UI Component + Stateless FastAPI Proxy) that allows developers to offload LLM API costs to the end-user. It provides a "Freemium-to-BYOK" bridge, enabling users to use their own API keys (OpenAI, Anthropic, Gemini, etc.) or local models (Ollama) through a security-hardened, zero-knowledge architecture.

---

## 2. Problem & Opportunity
* **The Cost Barrier:** Developers cannot scale agentic AI projects (which consume high tokens) without massive funding.
* **The Privacy Gap:** Users are hesitant to give their private API keys to unknown third-party servers.
* **The Fragmentation:** There is no standard UI component that handles the complexity of 100+ LLM providers and local model discovery.

---

## 3. Core Features (Functional Requirements)

### 3.1 The "Smart" UI Component (React/NPM)
* **Searchable Provider Registry:** A dropdown interface powered by LiteLLM metadata, allowing users to search by provider or model name.
* **Ollama Auto-Discovery:** A client-side "Local Scan" that pings `localhost:11434` to fetch and list local models automatically.
* **The Vault (Key Storage):**
    * **Session Only:** Keys kept in memory; cleared on refresh.
    * **Local Storage (Plain):** Persistence for convenience.
    * **Encrypted Local Storage (Optional Passphrase):** Users can enter a local password. The component uses AES-256 to encrypt the API key before saving it to the browser.
* **Real-time Validation:** A "Test Connection" button that runs a 1-token health check via the proxy.

### 3.2 The Stateless Proxy (FastAPI/Docker)
* **Universal Routing:** Uses LiteLLM to translate standard OpenAI-format requests to any provider.
* **Zero-Knowledge Architecture:** The server receives keys in the request header, processes them in-memory, and discards them instantly.
* **Stream Support:** Full support for Server-Sent Events (SSE) to ensure fast, "typewriter" style AI responses.

---

## 4. Technical Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18+, TypeScript, Tailwind CSS, Lucide Icons |
| **State** | Zustand (Global State) & React Query (API Sync) |
| **Encryption** | Web Crypto API / Crypto-JS (AES-256) |
| **Backend** | FastAPI (Python), LiteLLM, Uvicorn |
| **Distribution** | NPM (UI), Docker & Docker Compose (Full Stack) |

---

## 5. API & Interface Specifications

### Backend Endpoints
* `GET /v1/metadata`: Returns supported providers/models.
* `POST /v1/validate`: Dry-run key check (returns 200 OK or Error).
* `POST /v1/chat/completions`: The main gateway.
    * **Header Required:** `X-API-Key: <user_key>`
    * **Header Required:** `X-Provider: <provider_name>`

---

## 6. Architecture & Data Flow

1.  **Selection:** User selects "Anthropic/Claude-3-Sonnet" in the UI.
2.  **Authentication:** User enters API key.
3.  **Local Encryption:** (Optional) Key is encrypted via passphrase and stored in `localStorage`.
4.  **The Request:** The app sends a prompt to the Proxy. The `useBYOK` hook automatically injects the key into the `X-API-Key` header.
5.  **The Proxy:** FastAPI receives the request, LiteLLM routes it to Anthropic, and the stream is piped back to the client.

---

## 7. Security & Privacy Protocols
* **No Persistence:** The backend server is strictly forbidden from having a database.
* **Header Injection:** Keys are never sent in the request body (to prevent logging) but in the `X-API-Key` header.
* **No-Log Middleware:** A custom middleware redacts sensitive headers from server logs.
* **CORS Hardening:** The proxy only accepts requests from a whitelist of approved frontend origins.

---

## 8. Open Source & Distribution Strategy
* **Monorepo Structure:** Keep the component (`/packages/ui`) and the proxy (`/apps/proxy`) in one repo for easier maintenance.
* **NPM Listing:** Publish as `@aether-key/react` to allow `npm install`.
* **Self-Hosting Focus:** Provide a "Deploy to Railway" or "Deploy to Render" button in the README.
* **Listing:** Target "Awesome LLM" and "Awesome React" GitHub repos for visibility.

---