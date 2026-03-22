import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { AetherKeyModal, useBYOK, ConnectionStatus, useAetherKeyContext } from '@aether-key/react';
import '@aether-key/react/dist/index.css';

function Chat() {
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

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted-foreground text-sm flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    Loading...
                </div>
            </div>
        );
    }

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
                setMessages([...newMessages, { role: 'assistant', content: 'No model selected. Connect your AI first.' }]);
                setIsTyping(false);
                return;
            }

            const reqBody = { model, messages: newMessages, stream: false };

            const res = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(isOllama ? {} : headers) },
                body: JSON.stringify(reqBody),
            });

            if (!res.ok) throw new Error('Request failed');
            const data = await res.json();
            const reply = isOllama ? data.message?.content : data.choices?.[0]?.message?.content;
            setMessages([...newMessages, { role: 'assistant', content: reply || 'Empty response' }]);
        } catch (err: any) {
            setMessages([...newMessages, { role: 'assistant', content: `Error: ${err.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 flex flex-col h-screen">
                {/* Header */}
                <header className="flex items-center justify-between pb-4 mb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Aether-Key</h1>
                            <p className="text-xs text-muted-foreground">Universal BYOK Gateway</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ConnectionStatus />
                        <button
                            onClick={() => setIsOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>
                            {isConfigured ? 'Switch' : 'Connect'}
                        </button>
                    </div>
                </header>

                {/* Chat area */}
                <div className="flex-1 flex flex-col rounded-2xl border border-border overflow-hidden bg-card/50 min-h-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center px-8">
                                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">Ready to chat</p>
                                <p className="text-xs text-muted-foreground max-w-[240px]">
                                    {isConfigured ? 'Send a message to get started.' : 'Connect your AI provider to begin.'}
                                </p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                {m.role === 'user' ? (
                                    <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground rounded-br-md">
                                        {m.content}
                                    </div>
                                ) : (
                                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-muted text-foreground rounded-bl-md">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                code: ({ children, className }) => {
                                                    const isInline = !className;
                                                    if (isInline) {
                                                        return <code className="px-1.5 py-0.5 rounded bg-background/60 text-[13px] font-mono">{children}</code>;
                                                    }
                                                    return (
                                                        <pre className="mt-2 mb-2 p-3 rounded-lg bg-background/80 overflow-x-auto border">
                                                            <code className="text-[13px] font-mono">{children}</code>
                                                        </pre>
                                                    );
                                                },
                                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                                h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-1">{children}</h1>,
                                                h2: ({ children }) => <h2 className="text-sm font-bold mb-2 mt-1">{children}</h2>,
                                                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-1">{children}</h3>,
                                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                                em: ({ children }) => <em className="italic">{children}</em>,
                                                blockquote: ({ children }) => (
                                                    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-2 italic text-muted-foreground">{children}</blockquote>
                                                ),
                                                a: ({ children, href }) => (
                                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">{children}</a>
                                                ),
                                            }}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start animate-slide-up">
                                <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t bg-background/80 backdrop-blur-sm">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={!isConfigured || isTyping}
                                placeholder={isConfigured ? 'Type a message...' : 'Connect your AI first'}
                                className="flex-1 px-4 py-2.5 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!isConfigured || isTyping || !input.trim()}
                                className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <AetherKeyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
    );
}

export default Chat;
