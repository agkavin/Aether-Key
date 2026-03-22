import React from 'react'
import ReactDOM from 'react-dom/client'
import { AetherKeyProvider } from '@aether-key/react'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AetherKeyProvider
            proxyUrl={import.meta.env.VITE_PROXY_URL || 'http://localhost:8000'}
            ollamaUrl={import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'}
        >
            <App />
        </AetherKeyProvider>
    </React.StrictMode>,
)
