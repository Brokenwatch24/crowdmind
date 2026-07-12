import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <TooltipProvider delayDuration={200}>
        <App />
      </TooltipProvider>
    </HashRouter>
  </React.StrictMode>
)
