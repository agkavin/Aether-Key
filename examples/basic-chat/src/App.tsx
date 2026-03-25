import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AetherKeyModal, useBYOK, ConnectionStatus, useAetherKeyContext } from '@aether-key/react';
import { Send, Cpu, Sparkles, Trash2, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

function App() {
    const { proxyUrl, ollamaUrl } = useAetherKeyContext();
    const { headers, isConfigured, provider, model, isInitializing } = useBYOK();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !isConfigured) return;

        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        try {
            const isOllama = provider === 'ollama';
            const targetUrl = isOllama ? `${ollamaUrl}/api/chat` : `${proxyUrl}/v1/chat/completions`;

            if (!model) {
                setMessages([...newMessages, { role: 'assistant', content: '⚠️ No model selected. Connect your AI first.' }]);
                setIsTyping(false);
                return;
            }

            const reqBody = { model, messages: newMessages, stream: false };

            const res = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(isOllama ? {} : headers) },
                body: JSON.stringify(reqBody),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error?.message || data?.detail || 'Inference failed. Check your keys.');
            }

            const data = await res.json();
            const reply = isOllama ? data.message?.content : data.choices?.[0]?.message?.content;
            setMessages([...newMessages, { role: 'assistant', content: reply || 'Empty response' }]);
        } catch (err: any) {
            setMessages([...newMessages, { role: 'assistant', content: `❌ Error: ${err.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                        <Cpu className="text-primary" size={24} />
                    </div>
                    <div className="text-muted-foreground text-sm font-medium animate-pulse">Initializing Aether-Key...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-primary/30">
            <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col h-screen">
                {/* Header */}
                <header className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-900">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
                            <Sparkles className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight uppercase">
                                Aether <span className="text-blue-500">Key</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Universal BYOK Gateway</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ConnectionStatus />
                        <button
                            onClick={() => setIsOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all shadow-xl active:scale-95"
                        >
                            <Zap size={14} className={isConfigured ? "text-blue-400 fill-blue-400" : ""} />
                            {isConfigured ? 'Change AI' : 'Connect AI'}
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col gap-6 min-h-0">
                    {/* Chat Window */}
                    <div className="flex-1 flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md overflow-hidden shadow-2xl relative">
                        {/* Messages Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-12 animate-slide-up">
                                    <div className="h-20 w-20 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl relative group">
                                        <div className="absolute inset-0 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-all" />
                                        <MessageSquare size={32} className="text-zinc-600 relative" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Secure Local & Cloud Chat</h3>
                                    <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
                                        {isConfigured
                                            ? `You're connected to ${provider}:${model}. Send a message to start an encrypted inference session.`
                                            : 'Bring your own keys or use local Ollama. Encryption happens entirely in your browser.'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 mt-10 w-full max-w-md">
                                        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-left">
                                            <ShieldCheck size={18} className="text-blue-400 mb-2" />
                                            <p className="text-xs font-bold text-white mb-1 uppercase tracking-tight">Zero Knowledge</p>
                                            <p className="text-[10px] text-zinc-500 leading-tight">Keys are AES-256 encrypted client-side.</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-left">
                                            <Zap size={18} className="text-amber-400 mb-2" />
                                            <p className="text-xs font-bold text-white mb-1 uppercase tracking-tight">Unified API</p>
                                            <p className="text-[10px] text-zinc-500 leading-tight">Switch between 40+ providers instantly.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                messages.map((m, i) => (
                                    <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                        {m.role === 'assistant' && (
                                            <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-1">
                                                <Cpu size={16} className="text-blue-400" />
                                            </div>
                                        )}
                                        <div className={`max-w-[85%] rounded-[1.25rem] px-5 py-3 text-sm leading-relaxed shadow-lg ${m.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-sm border border-blue-500'
                                                : 'bg-zinc-800/80 text-zinc-100 rounded-tl-sm border border-zinc-700/50'
                                            }`}>
                                            <div className="prose prose-invert prose-dark max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {isTyping && (
                                <div className="flex justify-start gap-4 animate-slide-up">
                                    <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-1">
                                        <Cpu size={16} className="text-blue-400" />
                                    </div>
                                    <div className="bg-zinc-800/80 rounded-2xl rounded-tl-sm px-5 py-4 border border-zinc-700/50 shadow-lg">
                                        <div className="flex gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Box */}
                        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
                            <form onSubmit={handleSend} className="relative group flex items-end gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 transition-all focus-within:border-blue-500/50 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.05)]">
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    disabled={!isConfigured || isTyping}
                                    placeholder={isConfigured ? `Ask ${model?.split('/').pop()} anything...` : 'Connect your AI to start chatting'}
                                    rows={1}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 py-2.5 resize-none min-h-[44px] max-h-40 overflow-y-auto disabled:opacity-50 placeholder:text-zinc-600"
                                />
                                <button
                                    type="submit"
                                    disabled={!isConfigured || isTyping || !input.trim()}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all shrink-0 active:scale-90 shadow-lg"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                            <div className="flex justify-between items-center mt-3 px-2">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">
                                    {isConfigured ? `${provider} · ${model}` : 'Not Connected'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setMessages([])}
                                    className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={10} /> Clear Chat
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="mt-8 text-center animate-fade-in">
                    <p className="text-[10px] text-zinc-600 font-medium">
                        Keys are never stored on any server &bull; Transient inference via Aether-Key Proxy
                    </p>
                </footer>
            </div>

            <AetherKeyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
    );
}

export default App;
