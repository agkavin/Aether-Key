import React from 'react'
import ReactDOM from 'react-dom/client'
import { AetherKeyProvider } from '@aether-key/react'
import App from './App.tsx'
import './index.css'

const isWin = typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Windows');
const defaultOllama = isWin ? 'http://127.0.0.1:11434' : 'http://localhost:11434';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AetherKeyProvider
            proxyUrl={import.meta.env.VITE_PROXY_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:8000')}
            ollamaUrl={import.meta.env.VITE_OLLAMA_URL || defaultOllama}
        >
            <App />
        </AetherKeyProvider>
    </React.StrictMode>,
)
