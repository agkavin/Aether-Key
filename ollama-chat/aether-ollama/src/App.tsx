import { useState, useEffect, useRef } from 'react'
import ollama from 'ollama/browser'
import type { ModelResponse } from 'ollama/browser'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send, Cpu, RefreshCw, Trash2, StopCircle, Copy, Check,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      <span className="dot-1 inline-block w-2 h-2 rounded-full bg-blue-400" />
      <span className="dot-2 inline-block w-2 h-2 rounded-full bg-blue-400" />
      <span className="dot-3 inline-block w-2 h-2 rounded-full bg-blue-400" />
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 p-1.5 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${copied
        ? 'bg-green-500/20 border-green-500/50 text-green-400'
        : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500 text-zinc-400'
        }`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<ModelResponse[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [error, setError] = useState('')

  const chatEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Auto-scroll to bottom on new messages ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Fetch models on mount ──
  useEffect(() => {
    fetchModels()
  }, [])

  // ── Auto-resize textarea ──
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  async function fetchModels() {
    setError('')
    try {
      const list = await ollama.list()
      setModels(list.models)
      if (list.models.length > 0) {
        setSelectedModel(prev => prev || list.models[0].name)
      }
    } catch {
      setError('Could not reach Ollama. Make sure it\'s running with OLLAMA_ORIGINS set.')
    }
  }

  async function chat() {
    const userInput = input.trim()
    if (!userInput || !selectedModel || loading) return

    setInput('')
    setError('')

    const userMessage: Message = { role: 'user', content: userInput }
    const pendingAssistant: Message = { role: 'assistant', content: '', streaming: true }

    setMessages(prev => [...prev, userMessage, pendingAssistant])
    setLoading(true)

    abortRef.current = new AbortController()

    try {
      // Build full history for multi-turn context
      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const stream = await ollama.chat({
        model: selectedModel,
        messages: history,
        stream: true,
      })

      let accumulated = ''
      for await (const part of stream) {
        accumulated += part.message.content
        const snap = accumulated
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: snap, streaming: true }
          return next
        })
      }

      // Mark streaming done
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: accumulated }
        return next
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('abort')) {
        setMessages(prev => {
          const next = [...prev]
          const last = next[next.length - 1]
          next[next.length - 1] = { ...last, streaming: false }
          return next
        })
      } else {
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = {
            role: 'assistant',
            content: '⚠️ Error: Is Ollama running with `OLLAMA_ORIGINS` set correctly?',
          }
          return next
        })
        setError('Check that Ollama is running: OLLAMA_ORIGINS="https://ollama-chat.agkavin.dev" ollama serve')
      }
    }

    setLoading(false)
    abortRef.current = null
  }

  function stopGeneration() {
    abortRef.current?.abort()
  }

  function clearChat() {
    if (loading) stopGeneration()
    setMessages([])
    setError('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      chat()
    }
  }

  const isReady = selectedModel && !loading

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <header className="w-full max-w-3xl px-4 pt-10 pb-4 flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2">
            <Cpu className="text-blue-400" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none">
              AETHER <span className="text-blue-400">OLLAMA</span>
            </h1>
            <p className="text-zinc-500 text-xs mt-0.5">Local inference · No data leaves your machine</p>
          </div>
        </div>
      </header>

      {/* ── Model Selector Bar ── */}
      <div className="w-full max-w-3xl px-4 mb-3">
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0">Model</span>
            {models.length === 0 ? (
              <span className="text-zinc-600 text-sm italic">No models found</span>
            ) : (
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="bg-transparent text-sm font-medium text-blue-400 focus:outline-none cursor-pointer min-w-0 truncate"
              >
                {models.map(m => (
                  <option key={m.name} value={m.name} className="bg-zinc-900 text-white">
                    {m.name} · {(m.size / 1024 ** 3).toFixed(1)} GB
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={fetchModels}
              title="Refresh models"
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <RefreshCw size={14} className="text-zinc-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="w-full max-w-3xl px-4 mb-3">
          <div className="bg-red-950/50 border border-red-800/60 rounded-xl px-4 py-2.5 text-red-300 text-xs font-mono">
            {error}
          </div>
        </div>
      )}

      {/* ── Chat Area ── */}
      <div className="w-full max-w-3xl px-4 flex-1">
        <div
          className="chat-scroll bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 overflow-y-auto mb-4 shadow-2xl"
          style={{ height: 'min(520px, calc(100vh - 320px))', minHeight: '300px' }}
        >
          {messages.length === 0 ? (
            /* ── Empty State ── */
            <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-700 select-none">
              <Cpu size={52} strokeWidth={1} className="opacity-20" />
              <div className="text-center">
                <p className="font-medium text-sm text-zinc-500">Ready for local inference</p>
                <p className="text-xs mt-1">
                  {models.length > 0
                    ? `${models.length} model${models.length > 1 ? 's' : ''} available · ${selectedModel}`
                    : 'Start Ollama with OLLAMA_ORIGINS set to begin'}
                </p>
              </div>
              {/* Setup commands */}
              <div className="max-w-lg w-full flex flex-col gap-3 mt-2">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">One-time setup</span>
                  <p className="text-zinc-500 text-xs mt-3 px-4">
                    Run this command in your terminal — it configures Ollama to allow browser access.
                  </p>
                </div>

                {/* macOS / Linux */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">macOS / Linux</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">bash</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
                      <code className="text-[11px] font-mono text-blue-100/90 leading-relaxed whitespace-pre-wrap break-all w-full">
                        curl -fsSL https://ollama-chat.agkavin.dev/setup.sh | bash
                      </code>
                    </div>
                    <CopyButton text="curl -fsSL https://ollama-chat.agkavin.dev/setup.sh | bash" />
                  </div>
                </div>

                {/* Windows */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Windows</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">PowerShell · Run as Admin</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
                      <code className="text-[11px] font-mono text-blue-100/90 leading-relaxed whitespace-pre-wrap break-all w-full">
                        irm https://ollama-chat.agkavin.dev/setup.ps1 | iex
                      </code>
                    </div>
                    <CopyButton text="irm https://ollama-chat.agkavin.dev/setup.ps1 | iex" />
                  </div>
                </div>

                <p className="text-center text-zinc-700 text-[10px] px-4">
                  After running, hit the ↻ refresh button above — your models will appear.
                </p>
              </div>
            </div>
          ) : (
            /* ── Messages ── */
            <div className="flex flex-col gap-5">
              {messages.map((msg, i) => (
                <div key={i} className={`msg-in flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 w-7 h-7 bg-blue-500/15 border border-blue-500/30 rounded-lg flex items-center justify-center mt-0.5">
                      <Cpu size={14} className="text-blue-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50 rounded-br-sm'
                      : 'bg-zinc-800/70 border border-zinc-700/50 text-zinc-100 rounded-bl-sm'
                      }`}
                  >
                    {msg.role === 'assistant' ? (
                      msg.content === '' && msg.streaming ? (
                        <TypingDots />
                      ) : (
                        <div className={`prose prose-sm prose-invert prose-dark max-w-none ${msg.streaming ? 'cursor-blink' : ''}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="shrink-0 w-7 h-7 bg-zinc-700/60 border border-zinc-600/40 rounded-lg flex items-center justify-center mt-0.5 text-xs font-bold text-zinc-400">
                      U
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Input Bar ── */}
      <div className="w-full max-w-3xl px-4 pb-8">
        <div className={`flex gap-2 items-end bg-zinc-900 border rounded-2xl px-3 py-2 transition-all duration-200 ${isReady ? 'border-zinc-700 focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]' : 'border-zinc-800'
          }`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedModel}
            rows={1}
            className="flex-1 bg-transparent resize-none focus:outline-none text-sm leading-relaxed py-1 placeholder-zinc-600 disabled:opacity-40"
            placeholder={selectedModel ? `Message ${selectedModel.split(':')[0]}…  (Shift+Enter for newline)` : 'Select a model first…'}
            style={{ maxHeight: '160px' }}
          />
          {loading ? (
            <button
              onClick={stopGeneration}
              title="Stop generation"
              className="shrink-0 p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 transition-all text-red-400"
            >
              <StopCircle size={18} />
            </button>
          ) : (
            <button
              onClick={chat}
              disabled={!input.trim() || !selectedModel}
              title="Send (Enter)"
              className="shrink-0 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all text-white"
            >
              <Send size={18} />
            </button>
          )}
        </div>
        <p className="text-center text-[10px] text-zinc-700 mt-2">
          Running on <span className="text-zinc-600">ollama-chat.agkavin.dev</span> · Inference on your local machine
        </p>
      </div>

    </div>
  )
}

export default App
