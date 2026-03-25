This documentation outlines the steps to build and deploy your personal web interface for Ollama. Since your website will be hosted on a public domain (`ollama-chat.agkavin.dev`) but needs to talk to your local machine (`localhost`), the most critical part is bridging the **CORS security gap**.

---

# Project: Aether-Ollama Web Interface
**Domain:** `ollama-chat.agkavin.dev`  
**Goal:** A high-performance, streaming chat UI that uses your local GPU/CPU for inference at zero cost.

---

## 1. The Critical "Bridge" Command
By default, your browser will block `ollama-chat.agkavin.dev` from talking to `localhost` for security. You must allow your specific domain to access the Ollama API.

**Copy and run this command in your terminal before using the site:**

### **For macOS / Linux**
```bash
OLLAMA_ORIGINS="https://ollama-chat.agkavin.dev" ollama serve
```

### **For Windows (PowerShell)**
```powershell
$env:OLLAMA_ORIGINS="https://ollama-chat.agkavin.dev"; ollama serve
```

> [!TIP]
> **Pro-Tip:** If you are testing locally before deploying, use `OLLAMA_ORIGINS="*"` to allow any origin during development.

---

## 2. Architecture Overview


Your frontend is a "dumb" client. It doesn't process data; it only provides the UI. When you send a message, the browser makes a direct fetch request to `http://127.0.0.1:11434/api/chat`. Because you ran the command in Step 1, Ollama will accept the request and stream the response back.

---

## 3. Tech Stack
* **Frontend:** React (Vite) + Tailwind CSS.
* **Library:** `ollama-js` (Browser module).
* **Deployment:** Cloudflare Pages (Direct Upload via Wrangler).

---

## 4. Implementation Steps

### **Step 1: Initialize Project**
```bash
npm create vite@latest aether-ollama -- --template react-ts
cd aether-ollama
npm install ollama lucide-react
```

### **Step 2: The Minimal Chat Logic (`App.tsx`)**
This code uses the `/browser` entry point to ensure it works in the Cloudflare environment.

```typescript
import { useState } from 'react'
import ollama from 'ollama/browser'
import { Send, Cpu } from 'lucide-react'

function App() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  async function chat() {
    setLoading(true);
    setResponse('');
    try {
      const stream = await ollama.chat({
        model: 'llama3.1', // Ensure you have pulled this model locally
        messages: [{ role: 'user', content: input }],
        stream: true,
      })

      for await (const part of stream) {
        setResponse((prev) => prev + part.message.content)
      }
    } catch (e) {
      setResponse("Error: Is Ollama running with OLLAMA_ORIGINS set?");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-4">
      <header className="flex items-center gap-2 mb-8 mt-10">
        <Cpu className="text-blue-500" />
        <h1 className="text-2xl font-bold">Aether Ollama</h1>
      </header>
      
      <div className="w-full max-w-2xl bg-zinc-900 rounded-lg p-6 border border-zinc-800 h-96 overflow-y-auto mb-4">
        {response || <span className="text-zinc-500 italic">Ready to chat with localhost...</span>}
      </div>

      <div className="w-full max-w-2xl flex gap-2">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-3 focus:outline-none focus:border-blue-500"
          placeholder="Type your prompt..."
        />
        <button onClick={chat} disabled={loading} className="bg-blue-600 hover:bg-blue-700 p-3 rounded">
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}
export default App
```

---

## 5. Deployment to Cloudflare
Since you already own `agkavin.dev` and use Cloudflare, you can deploy in one command.

1.  **Build the site:**
    ```bash
    npm run build
    ```
2.  **Deploy via Wrangler:**
    ```bash
    npx wrangler pages deploy ./dist --project-name aether-ollama
    ```
3.  **Map Custom Domain:**
    * Go to **Cloudflare Dashboard** > **Workers & Pages**.
    * Select your project `aether-ollama`.
    * Go to **Custom Domains** and add `ollama-chat.agkavin.dev`.

---

## 6. Summary of Workflows
| Action | Command |
| :--- | :--- |
| **Pull Model** | `ollama pull llama3.1` |
| **Start "Bridge"** | `OLLAMA_ORIGINS="https://ollama-chat.agkavin.dev" ollama serve` |
| **Update Site** | `npm run build && npx wrangler pages deploy ./dist` |


---

It looks like you're ready for the **"Model Selector" upgrade**. 

Hardcoding `llama3.1` is fine for a start, but a real pro-tool should let you pick from whatever you’ve already pulled onto your machine (like `phi4`, `mistral`, or `deepseek-r1`). 

Here is the updated **`App.tsx`** that automatically fetches your local models the moment the page loads.

---

### **Aether-Ollama V2: The Model Selector**

This version adds an `useEffect` hook to call `ollama.list()` and populates a dropdown.

```typescript
import { useState, useEffect } from 'react'
import ollama, { ModelResponse } from 'ollama/browser'
import { Send, Cpu, ChevronDown, RefreshCw } from 'lucide-react'

function App() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<ModelResponse[]>([])
  const [selectedModel, setSelectedModel] = useState('')

  // 1. Fetch local models on mount
  useEffect(() => {
    fetchModels()
  }, [])

  async function fetchModels() {
    try {
      const list = await ollama.list()
      setModels(list.models)
      if (list.models.length > 0) setSelectedModel(list.models[0].name)
    } catch (e) {
      console.error("Failed to fetch models. Is Ollama running?")
    }
  }

  async function chat() {
    if (!selectedModel) return;
    setLoading(true);
    setResponse('');
    try {
      const stream = await ollama.chat({
        model: selectedModel, 
        messages: [{ role: 'user', content: input }],
        stream: true,
      })

      for await (const part of stream) {
        setResponse((prev) => prev + part.message.content)
      }
    } catch (e) {
      setResponse("Error: Check OLLAMA_ORIGINS or if the model exists.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-4 font-sans">
      <header className="flex flex-col items-center gap-2 mb-8 mt-10">
        <div className="flex items-center gap-2">
          <Cpu className="text-blue-500" size={32} />
          <h1 className="text-3xl font-black tracking-tighter">AETHER OLLAMA</h1>
        </div>
        <p className="text-zinc-500 text-sm">Running on ollama-chat.agkavin.dev</p>
      </header>
      
      {/* Model Selector Bar */}
      <div className="w-full max-w-2xl mb-4 flex items-center justify-between bg-zinc-900 p-2 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs font-bold text-zinc-500 uppercase">Model:</span>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-blue-400"
          >
            {models.map((m) => (
              <option key={m.name} value={m.name} className="bg-zinc-900 text-white">
                {m.name} ({(m.size / 1024**3).toFixed(1)} GB)
              </option>
            ))}
          </select>
        </div>
        <button onClick={fetchModels} className="p-2 hover:bg-zinc-800 rounded-md transition-colors">
          <RefreshCw size={14} className="text-zinc-500" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="w-full max-w-2xl bg-zinc-900 rounded-xl p-6 border border-zinc-800 h-[500px] overflow-y-auto mb-4 shadow-2xl">
        {response ? (
          <div className="prose prose-invert max-w-none leading-relaxed">
            {response}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
            <Cpu size={48} strokeWidth={1} className="opacity-20" />
            <p className="italic text-center">
              Select a model and send a message to start local inference.
            </p>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="w-full max-w-2xl flex gap-3">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && chat()}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          placeholder={`Message ${selectedModel}...`}
        />
        <button 
          onClick={chat} 
          disabled={loading || !selectedModel} 
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 px-6 rounded-xl font-bold transition-all flex items-center gap-2"
        >
          {loading ? "Thinking..." : <Send size={20} />}
        </button>
      </div>
    </div>
  )
}

export default App
```

---

### **Why this version is better:**
1.  **Dynamic Sizing:** It displays the model size (e.g., `llama3.1 (4.7 GB)`), so you know how much weight you're throwing at your RAM.
2.  **Auto-Refresh:** Added a `RefreshCw` button so you can pull a new model in your terminal and see it appear in the UI without refreshing the whole page.
3.  **Enter to Send:** Added the `onKeyDown` listener because clicking the mouse is for 2024.

---

### **The "Don't Forget" Step**
Since you are now using the `ollama.list()` API, ensure your one-liner is active so the browser doesn't get blocked:

```bash
OLLAMA_ORIGINS="https://ollama-chat.agkavin.dev" ollama serve
```
